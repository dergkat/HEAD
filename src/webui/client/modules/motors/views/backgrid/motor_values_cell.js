(function (root, factory) {

    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['underscore', 'backgrid', 'nouislider', 'lib/api', 'nouislider-css'], factory);
    } else if (typeof exports === 'object') {
        // CommonJS
        module.exports = factory(require("underscore"),
            require("backgrid"));
    } else {
        // Browser globals
        factory(root._, root.Backgrid);
    }

}(this, function (_, Backgrid, noUiSlider, api) {

    var exports = {},
        MotorValuesEditor = exports.MotorValuesEditor = Backgrid.Extension.MotorValuesEditor = Backgrid.CellEditor.extend({

        /** @property */
        tagName: "div",

        /** @property */
        className: "modal fade",

        /** @property {function(Object, ?Object=): string} template */
        template: function (data) {
            return '<div class="modal-dialog"><div class="modal-content"><form><div class="modal-header"><button type="button" class="close" data-dismiss="modal">&times;</button><h3>Motor Values</h3></div><div class="modal-body"><div class="app-slider"></div><div class="row"><div class="col-md-4">Minimum:<span class="app-min-val"></span></div><div class="col-md-4">Initial:<span class="app-init-val"></span></div><div class="col-md-4">Maximum:<span class="app-max-val"></span></div></div></div><div class="modal-footer"><input class="btn btn-primary" type="submit" value="Done"/></div></form></div></div>';
        },

        /** @property */
        events: {
            "submit": "save",
            "hide.bs.modal": "hide",
            "hidden.bs.modal": "close"
        },

        /**
         @property {Object} modalOptions The options passed to Bootstrap's modal
         plugin.
         */
        modalOptions: {
            backdrop: false
        },

        /**
         Renders a modal form dialog with a textarea, submit button and a close button.
         */
        render: function () {
            this.$el.html($(this.template({}))).attr('tabindex', '-1');

            this.delegateEvents();
            this.updateValues();

            let self = this,
                min = 700,
                max = 2300;

            if (this.model.get('hardware') == 'dynamixel') {
                min = 0;
                max = 4096;
            }

            let slider = $('.app-slider', this.$el).get(0);

            this.originalValues = [this.model.get('min') || 1450, this.model.get('init') || 1500, this.model.get('max') || 1550];
            noUiSlider.create(slider, {
                start: this.originalValues,
                range: {
                    'min': [min],
                    'max': [max]
                }
            });

            slider.noUiSlider.on('slide', function( values, handle ) {
                console.log(self.model)
                var val = 0;
                if (handle === 0){
                    val = parseInt(values[0])
                    self.model.set('min', val);
                } else if (handle === 1){
                    val = parseInt(values[1])
                    self.model.set('init', val);
                } else if (handle === 2){
                    val = parseInt(values[2]);
                    self.model.set('max', val);
                }
                if (self.model.get('hardware') != 'dynamixel'){
                    api._sendMotorCommand(
                        {
                            'name': self.model.get('motor_id'),
                            'topic': self.model.get('topic'),
                            'min': -3.1416/2, // -pi/2
                            'max': 3.1416/2,  // pi/2
                        },
                        -3.1416/2 + ((val - min) / (max-min)) * 3.1416
                    );
                }

            });

            this.listenTo(this.model, 'change:min change:init change:max', this.updateValues);
            this.$el.modal(this.modalOptions);

            return this;
        },
        updateValues: function () {
            $('.app-min-val', this.$el).html(this.model.get('min') || 1450);
            $('.app-init-val', this.$el).html(this.model.get('init') || 1500);
            $('.app-max-val', this.$el).html(this.model.get('max') || 1550);
        },
        save: function (e) {
            if (e) {
                e.preventDefault();
                e.stopPropagation();
            }
            // Update values
            this.originalValues = [this.model.get('min'), this.model.get('init'), this.model.get('max')];
            this.$el.modal("hide");
        },

        hide: function () {
            this.model.set({
                min: this.originalValues[0],
                init: this.originalValues[1],
                max: this.originalValues[2]
            });
        },
        /**
         Triggers a `backgrid:edited` event along with the cell editor as the
         parameter after the modal is hidden.

         @param {Event} e
         */
        close: function (e) {
            this.model.trigger("backgrid:edited", this.model, this.column, new Backgrid.Command(e));
        }
    });

    /**
     TextCell is a string cell type that renders a form with a text area in a
     modal dialog instead of an input box editor. It is best suited for entering
     a large body of text.

     @class Backgrid.Extension.MotorValuesCell
     @extends Backgrid.StringCell
     */
    exports.MotorValuesCell = Backgrid.Extension.MotorValuesCell = Backgrid.IntegerCell.extend({

        /** @property */
        className: "motor-values-cell",

        /** @property  */
        editor: MotorValuesEditor

    });

    return exports;
}));
