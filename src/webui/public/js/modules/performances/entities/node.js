define(['application', 'backbone', 'lib/api', 'jquery', 'supermodel', 'underscore'],
    function (App, Backbone, api, $, Supermodel, _) {
        return Supermodel.Model.extend({
            config: {
                emotion: {
                    label: 'Emotion',
                    properties: ['duration', 'magnitude', 'emotion'],
                    defaultValues: {magnitude: [0.9, 1]}
                },
                interaction: {
                    label: 'Interaction',
                    properties: ['duration', 'btree_mode', 'speech_event'],
                    defaultValues: {mode: 255, chat: ''}
                },
                listening: {
                    label: 'Listening',
                    properties: ['duration']
                },
                expression: {
                    label: 'Expression',
                    properties: ['duration', 'expression', 'magnitude'],
                    defaultValues: {magnitude: [0.9, 1]}
                },
                chat_pause: {
                    label: 'Chat pause',
                    properties: ['duration', 'message'],
                    defaultValues: {message: ''}
                },
                soma: {
                    label: 'Soma State',
                    properties: ['duration', 'soma']
                },
                gesture: {
                    label: 'Animation',
                    properties: ['speed', 'animation', 'magnitude'],
                    defaultValues: {speed: 1, magnitude: [0.9, 1]}
                },
                head_rotation: {
                    label: 'Head Tilt',
                    properties: ['angle', 'speed'],
                    defaultValues: {speed: 1, angle: 0}
                },
                kfanimation: {
                    label: 'KF Animation',
                    properties: ['kfanimation', 'fps', 'blender_mode'],
                    defaultValues: {blender_mode: 'no', fps: 24}
                },
                speech: {
                    label: 'Speech',
                    properties: ['language', 'speed', 'pitch', 'volume', 'text'],
                    defaultValues: {speed: 1, pitch: 1, volume: 1, text: ''}
                },
                look_at: {
                    label: 'Look at',
                    properties: ['attention_region', 'crosshair', 'speed'],
                    defaultValues: {speed: 1}
                },
                gaze_at: {
                    label: 'Gaze at',
                    properties: ['attention_region', 'crosshair', 'speed'],
                    defaultValues: {speed: 1}
                },
                pause: {
                    label: 'Pause',
                    properties: ['topic', 'timeout'],
                    defaultValues: {duration: 0.2}
                },
                default: {
                    label: 'Node',
                    properties: []
                }
            },
            initialize: function (options) {
                Supermodel.Model.prototype.initialize.call(this, options);
                this.set('id', this.cid);
                this.on('change:el', this.updateEl);
                this.on('change:name', this.setDefaultValues);
                this.setDefaultValues();
            },
            setDefaultValues: function () {
                var defaultValues = this.getConfig().defaultValues;
                if (defaultValues) this.set(_.extend(_.clone(defaultValues), this.attributes));
            },
            call: function () {
                switch (this.get('name')) {
                    case 'look_at':
                        api.setFaceTarget(this.get('x'), this.get('y'), this.get('z'));
                        break;
                    case 'gaze_at':
                        api.setGazeTarget(this.get('x'), this.get('y'), this.get('z'));
                        break;
                    case 'head_rotation':
                        api.set_head_rotation(this.get('angle'));
                        break;
                }
            },
            onDestroy: function () {
                this.removeEl();
            },
            getConfig: function () {
                var name = this.get('name');
                return this.config[name] || this.config['default'];
            },
            hasProperty: function (property) {
                return _.contains(this.getConfig().properties, property);
            },
            getLabel: function () {
                return this.getConfig().label;
            },
            getTitle: function () {
                var title = this.getLabel();

                if (this.get('text'))
                    title = this.get('text');
                else if (this.get('emotion'))
                    title = this.get('emotion');
                else if (this.get('gesture'))
                    title = this.get('gesture');
                else if (this.get('expression'))
                    title = this.get('expression');
                else if (this.get('animation') || this.get('kfanimation'))
                    title = this.get('animation');

                return title
            },
            updateEl: function () {
                if (this.previous('el')) $(this.previous('el')).remove();
            },
            removeEl: function () {
                if (this.get('el')) $(this.get('el')).remove();
            },
            toJSON: function () {
                var json = Supermodel.Model.prototype.toJSON.call(this);
                if (this.get('el')) delete json['el'];

                return json;
            },
            destroy: function () {
                // remove an associated element
                if (this.collection) this.collection.remove(this);
                if (this.get('el')) $(this.get('el')).remove();
                this.unset('id');
                Supermodel.Model.prototype.destroy.call(this);
            }
        });
    });
