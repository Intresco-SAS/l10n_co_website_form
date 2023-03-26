# -*- coding: utf-8 -*-

import logging
from werkzeug.exceptions import Forbidden

from odoo import http
from odoo.http import request
from odoo.exceptions import ValidationError
from odoo import tools, _
from odoo.addons.website_sale.controllers.main import WebsiteSale

_logger = logging.getLogger(__name__)


class WebsiteSaleInh(WebsiteSale):

    def _get_mandatory_shipping_fields(self):
        return ['x_name1', 'x_lastname1', "street", "country_id", "xidentification"]

    def _get_mandatory_billing_fields(self):
        return ['x_name1', 'x_lastname1', "email", "street", "country_id", 'xidentification']
    
    @http.route(['/shop/state_infos/<model("res.country.state"):state>'], type='json', auth="public", methods=['POST'], website=True)
    def state_infos(self, state, mode, **kw):
        return dict(
            states=[(st.id, st.name) for st in state.get_website_sale_states_city(mode=mode)]
        )
        
    def values_postprocess(self, order, mode, values, errors, error_msg):
        new_values = {}
        authorized_fields = request.env['ir.model']._get('res.partner')._get_form_writable_fields()
        for k, v in values.items():
            if k in ['xcity', 'x_name1', 'x_name2', 'x_lastname1', 'x_lastname2', 'xidentification', 'doctype']:
                new_values[k] = v
                if k == 'xcity' and v == 00:
                    new_values[k] = False
                if k == 'xcity' and v != 00:
                    # new_values[k] = False
                    city_id = request.env['res.country.state.city'].sudo().browse(int(v))
                    if city_id:
                        new_values['city'] = city_id.name
            # don't drop empty value, it could be a field to reset
            if k in authorized_fields and v is not None:
                new_values[k] = v
            else:  # DEBUG ONLY
                if k not in ('field_required', 'partner_id', 'callback', 'submitted'): # classic case
                    _logger.debug("website_sale postprocess: %s value has been dropped (empty or not writable)" % k)

        if request.website.specific_user_account:
            new_values['website_id'] = request.website.id

        if mode[0] == 'new':
            new_values['company_id'] = request.website.company_id.id
            new_values['team_id'] = request.website.salesteam_id and request.website.salesteam_id.id
            new_values['user_id'] = request.website.salesperson_id.id

        lang = request.lang.code if request.lang.code in request.website.mapped('language_ids.code') else None
        if lang:
            new_values['lang'] = lang
        if mode == ('edit', 'billing') and order.partner_id.type == 'contact':
            new_values['type'] = 'other'
        if mode[1] == 'shipping':
            new_values['parent_id'] = order.partner_id.commercial_partner_id.id
            new_values['type'] = 'delivery'

        return new_values, errors, error_msg
    
    def checkout_form_validate(self, mode, all_form_values, data):
        # mode: tuple ('new|edit', 'billing|shipping')
        # all_form_values: all values before preprocess
        # data: values after preprocess
        error = dict()
        error_message = []

        # Required fields from form
        required_fields = [f for f in (all_form_values.get(
            'field_required') or '').split(',') if f]
        # Required fields from mandatory field function
        required_fields += mode[1] == 'shipping' and self._get_mandatory_shipping_fields(
        ) or self._get_mandatory_billing_fields()
        # Check if state required
        country = request.env['res.country']
        if data.get('country_id'):
            country = country.browse(int(data.get('country_id')))
            if 'state_code' in country.get_address_fields() and country.state_ids:
                required_fields += ['state_id']

        # error message for empty required fields
        for field_name in required_fields:
            if not data.get(field_name):
                error[field_name] = 'missing'

        # # Ya no se valida porque realizara un merge con el que existe
        # # eidentification validation
        # if data.get('xidentification'):
        #     partner = request.env['res.partner'].sudo().search([('xidentification', '=', data.get('xidentification'))], limit=1)
        #     if partner:
        #         error["xidentification"] = 'error'
        #         error_message.append(
        #             _('Ya existe un usuario con el mismo número de documento en nuestra plataforma.'	          
        #                 ' Si es primera vez que se registra, comuniquese con nuestra tienda, Gracias.'))

        # email validation
        if data.get('email') and not tools.single_email_re.match(data.get('email')):
            error["email"] = 'error'
            error_message.append(
                _('Invalid Email! Please enter a valid email address.'))

        # vat validation
        Partner = request.env['res.partner']
        if data.get("vat") and hasattr(Partner, "check_vat"):
            if data.get("country_id"):
                data["vat"] = Partner.fix_eu_vat_number(
                    data.get("country_id"), data.get("vat"))
            partner_dummy = Partner.new({
                'vat': data['vat'],
                'country_id': (int(data['country_id'])
                               if data.get('country_id') else False),
            })
            try:
                partner_dummy.check_vat()
            except ValidationError:
                error["vat"] = 'error'

        if [err for err in error.values() if err == 'missing']:
            error_message.append(_('Some required fields are empty.'))

        return error, error_message    