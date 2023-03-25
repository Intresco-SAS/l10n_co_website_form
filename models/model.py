# -*- coding: utf-8 -*-

import logging
_logger = logging.getLogger(__name__)

from odoo import models


class ResCountryState(models.Model):
    _inherit = 'res.country.state'

    def get_website_sale_states_city(self, mode='billing'):
        city = self.env['res.country.state.city'].sudo().search([('state_id', '=', self.id)])
        return city
  
  