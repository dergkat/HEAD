import os
import time
from testing_tools.misc import SerialPortRecorder, MessageQueue
from testing_tools.protocol.pololu import CompactProtocal
import rospy
import rostopic
from collections import OrderedDict
from blender_api_msgs.srv import GetParam, SetParam
from ros_pololu.msg import MotorCommand
from blender_api_msgs.msg import SetGesture
from pau2motors.msg import pau
from datetime import datetime
import pandas as pd
from frame2motor import load_motor_configs, get_shkey_motors
from collections import defaultdict

HR_WORKSPACE = os.environ.get('HR_WORKSPACE', os.path.expanduser('~/hansonrobotics'))
CWD = os.path.abspath(os.path.dirname(__file__))

def parse_raw_data(raw_data_file, parsed_data_file):
    parser = CompactProtocal()
    with open(raw_data_file) as f:
        data = f.read()
        instructions = parser.parse(data)

    motor_configs = load_motor_configs()
    shkey_motors = get_shkey_motors(motor_configs)
    id2motor = {motor_configs[name]['motor_id']: name for name in shkey_motors}

    msgs = defaultdict(list)
    for i in instructions:
        cmd, motor_id, value = i
        if cmd != 'position': continue
        if motor_id in id2motor:
            msgs[id2motor[motor_id]].append(value)
    if len(msgs) == 0: return
    msg_len = len(msgs.values()[0])
    for key, value in msgs.iteritems():
        assert len(value) == msg_len

    with open(parsed_data_file, 'w') as f:
        header = sorted(msgs.keys())
        f.write('%s\n' % ','.join(header))
        for i in range(msg_len):
            values = [msgs[k][i] for k in header]
            f.write('%s\n' % ','.join(map(str, values)))
    print "Write serial data to %s" % parsed_data_file

def record(device, serial_port_data_file, pau_data_file, gesture, duration):
    raw_data_file = os.path.join(CWD, 'serial_port_data.raw')
    recorder = SerialPortRecorder(device, raw_data_file)

    rospy.init_node("record")
    rospy.wait_for_service('/blender_api/get_param')
    rospy.wait_for_service('/blender_api/set_param')
    blender_get_param = rospy.ServiceProxy('/blender_api/get_param', GetParam)
    blender_set_param = rospy.ServiceProxy('/blender_api/set_param', SetParam)

    blender_set_param("bpy.context.scene['commandListenerActive']", "False")
    time.sleep(2)
    os.system('cat < {}'.format(device))

    blender_set_param("bpy.context.scene['commandListenerActive']", "True")
    recorder.start()
    print "Start recording"

    # publish animation message
    queue = MessageQueue()
    queue.subscribe('/blender_api/get_pau', pau)
    pub = rospy.Publisher('/blender_api/set_gesture', SetGesture, latch=True)
    pub.publish(SetGesture(gesture, 1, 1, 1))
    timestamps = OrderedDict()
    timestamps['publish_set_gesture_msg'] = time.time()

    current_gestures = None
    while current_gestures is None:
        current_gestures = eval(blender_get_param("self.getGestures()").value)
        time.sleep(0.01)
    timestamps['blender_play_gestures'] = time.time()

    motor_msg = rospy.wait_for_message('/sophia/safe/head/command', MotorCommand)
    timestamps['motor_command_arrive'] = time.time()

    time.sleep(duration) # wait for animation to finish
    blender_set_param("bpy.context.scene['commandListenerActive']", "False")
    recorder.stop()
    print "Stop recording"

    pau_messages = queue.tolist()
    shapekeys = eval(blender_get_param("self.getFaceData()").value)
    pau_df = pd.DataFrame(columns = shapekeys.keys())
    for pau_message in pau_messages:
        pau_df.loc[len(pau_df)] = pau_message.m_coeffs
    pau_df.to_csv(pau_data_file, index=False)
    print "Write pau message to %s" % pau_data_file

    timestamps['first_serial_port_data'] = recorder.start_time
    timestamps['last_serial_port_data'] = recorder.stop_time
    for k, v in timestamps.items():
        print k, datetime.fromtimestamp(v)

    parse_raw_data(raw_data_file, serial_port_data_file)
    os.remove(raw_data_file)

if __name__ == '__main__':
    device = os.path.expanduser('~/workspace/hansonrobotics/scripts/pololu1')
    serial_port_data_file = os.path.join(CWD, 'serial_port_data.csv')
    pau_data_file = os.path.join(CWD, 'pau_data.csv')
    #duration = 28
    #gesture = 'all'
    duration = 9
    gesture = 'yawn-1'
    record(device, serial_port_data_file, pau_data_file, gesture, duration)
