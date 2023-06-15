odoo.define('enhancement.website_sale', function (require) {
'use strict';

var core = require('web.core');
var config = require('web.config');
var concurrency = require('web.concurrency');
var sAnimations = require('website.content.snippets.animation');
var wSaleUtils = require('website_sale.utils');

var qweb = core.qweb;

sAnimations.registry.WebsiteSale.include({
    selector: '.oe_website_sale',
    read_events: {
        'change form .js_product:first input[name="add_qty"]': '_onChangeAddQuantity',
        'mouseup .js_publish': '_onMouseupPublish',
        'touchend .js_publish': '_onMouseupPublish',
        'change .oe_cart input.js_quantity[data-product-id]': '_onChangeCartQuantity',
        'click .oe_cart a.js_add_suggested_products': '_onClickSuggestedProduct',
        'click a.js_add_cart_json': '_onClickAddCartJSON',
        'click .a-submit': '_onClickSubmit',
        'change form.js_attributes input, form.js_attributes select': '_onChangeAttribute',
        'mouseup form.js_add_cart_json label': '_onMouseupAddCartLabel',
        'touchend form.js_add_cart_json label': '_onMouseupAddCartLabel',
        'click .show_coupon': '_onClickShowCoupon',
        'submit .o_website_sale_search': '_onSubmitSaleSearch',
        'change select[name="country_id"]': '_onChangeCountry',
        'change #shipping_use_same': '_onChangeShippingUseSame',
        'click .toggle_summary': '_onToggleSummary',
        'click input.js_product_change': 'onChangeVariant',
        'change .js_main_product [data-attribute_exclusions]': 'onChangeVariant',
        'change select[name="xcity"]': '_onChangeCity',
        'change select[name="state_id"]': '_onChangeState',
    },

    /**
     * @private
     */
    _changeCity: function () {
        var $city = $('select[name="xcity"] option:selected');
        var $state_id = $city.data('state_id')
        var $cont_id = $city.data('country_id')

        $('select[name="country_id"]').val($cont_id)
        $('select[name="state_id"]').val($state_id)

        var $city_name = $.trim($('select[name="xcity"] option:selected').text())
        $("input[name='city']").val($city_name)
    },
    /**
     * @private
     */
    _changeState: function () {
        console.log('###########')
        console.log($("#state_id").val())
        if (!$("#state_id").val()) {
            return;
        }
        this._rpc({
            route: "/shop/state_infos/" + $("#state_id").val(),
            params: {
                mode: 'shipping',
            },
        }).then(function (data) {
            // placeholder phone_code
            //$("input[name='phone']").attr('placeholder', data.phone_code !== 0 ? '+'+ data.phone_code : '');

            // populate states and display
            var selectStates = $("select[name='xcity']");
            // dont reload state at first loading (done in qweb)
            if (selectStates.data('init')===0 || selectStates.find('option').length===1) {
                if (data.states.length) {
                    selectStates.html('');
                    _.each(data.states, function (x) {
                        var opt = $('<option>').text(x[1])
                            .attr('value', x[0]);
                        selectStates.append(opt);
                    });
                    selectStates.parent('div').show();
                } else {
                    selectStates.val('').parent('div').hide();
                }
                selectStates.data('init', 0);
            } else {
                selectStates.data('init', 0);
            }
        });
    },


  


    /**
     * @private
     * @param {Event} ev
     */
    
    _changeCountry: function () {
        if ($("#country_id").val() == false) {
            return;
        }
        this._rpc({
            route: "/shop/country_infos/" + $("#country_id").val(),
            params: {
                mode: $("#country_id")
            },
        }).then(function (data) {
            // placeholder phone_code
            $("input[name='phone']").attr('placeholder', data.phone_code !== 0 ? '+'+ data.phone_code : '');

            // populate states and display
            var selectStates = $("select[name='state_id']");
            // dont reload state at first loading (done in qweb)
            if (selectStates.data('init')===0 || selectStates.find('option').length===1) {
                if (data.states.length || data.state_required) {
                    selectStates.html('');
                    _.each(data.states, function (x) {
                        var opt = $('<option>').text(x[1])
                            .attr('value', x[0])
                            .attr('data-code', x[2]);
                        selectStates.append(opt);
                    });
                    selectStates.parent('div').show();
                } else {
                    selectStates.val('').parent('div').hide();
                }
                selectStates.data('init', 0);
            } else {
                selectStates.data('init', 0);
            }

            // manage fields order / visibility
            if (data.fields) {
//                if ($.inArray('zip', data.fields) > $.inArray('city', data.fields)){
//                    $(".div_zip").before($(".div_city"));
//                } else {
//                    $(".div_zip").after($(".div_city"));
//                }
                var all_fields = ["street", "city", "country_name"]; // "state_code"];
                _.each(all_fields, function (field) {
                    $(".checkout_autoformat .div_" + field.split('_')[0]).toggle($.inArray(field, data.fields)>=0);
                });
            }

            if ($("label[for='zip']").length) {
                $("label[for='zip']").toggleClass('label-optional', !data.zip_required);
                $("label[for='zip']").get(0).toggleAttribute('required', !!data.zip_required);
            }
            if ($("label[for='zip']").length) {
                $("label[for='state_id']").toggleClass('label-optional', !data.state_required);
                $("label[for='state_id']").get(0).toggleAttribute('required', !!data.state_required);
            }
        });
    },
    /**
     * @private
     * @param {Event} ev
     */
    _onChangeState: function (ev) {
        if (!this.$('.checkout_autoformat').length) {
            return;
        }
        this._changeState();
    },

    /**
     * @private
     * @param {Event} ev
     */
    _onChangeCity: function (ev) {
        if (!this.$('.checkout_autoformat').length) {
            return;
        }
        //this._changeCity();
    },
});

});