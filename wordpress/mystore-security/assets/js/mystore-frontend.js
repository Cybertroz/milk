/**
 * MyStore Vanilla JavaScript Controller (No build step, zero inline scripts, zero innerHTML with untrusted data).
 */
(function (window, document) {
    'use strict';

    var mystoreFrontend = {
        init: function () {
            this.bindQuickOrder();
            this.bindDeliveryPreview();
        },

        bindQuickOrder: function () {
            var containers = document.querySelectorAll('.mystore_quick_order_section');
            containers.forEach(function (section) {
                var ajaxUrl = section.getAttribute('data-mystore-ajax') || '';
                var nonce = section.getAttribute('data-mystore-nonce') || '';
                var statusEl = section.querySelector('.mystore_quick_status');

                section.addEventListener('input', function (event) {
                    var target = event.target;
                    if (!(target instanceof HTMLInputElement) || !target.classList.contains('mystore_qty_input')) {
                        return;
                    }
                    var card = target.closest('.mystore_quick_card');
                    if (!card) {
                        return;
                    }
                    var traySize = parseInt(card.getAttribute('data-tray-size') || '0', 10);
                    var qty = parseInt(target.value || '0', 10);
                    var hintEl = card.querySelector('.mystore_tray_badge');
                    if (!hintEl || traySize <= 0 || isNaN(qty) || qty <= 0) {
                        return;
                    }
                    var rem = qty % traySize;
                    if (rem === 0) {
                        var trays = Math.floor(qty / traySize);
                        hintEl.textContent = 'Tray-friendly! ' + trays + ' full tray' + (trays > 1 ? 's' : '') + ' (' + qty + ' pcs)';
                    } else {
                        var needed = traySize - rem;
                        hintEl.textContent = 'Tray-friendly tip: Add ' + needed + ' more to complete a tray (' + traySize + ' pcs/tray)';
                    }
                });

                section.addEventListener('click', function (event) {
                    var target = event.target;
                    if (!(target instanceof HTMLElement)) {
                        return;
                    }

                    var card = target.closest('.mystore_quick_card');
                    if (!card) {
                        return;
                    }

                    var qtyInput = card.querySelector('.mystore_qty_input');
                    if (!(qtyInput instanceof HTMLInputElement)) {
                        return;
                    }

                    if (target.classList.contains('mystore_add_tray_btn')) {
                        var traySize = parseInt(card.getAttribute('data-tray-size') || '1', 10);
                        var currentQty = parseInt(qtyInput.value || '0', 10);
                        if (isNaN(currentQty) || currentQty < 0) {
                            currentQty = 0;
                        }
                        qtyInput.value = String(Math.min(500, currentQty + Math.max(1, traySize)));
                        qtyInput.dispatchEvent(new Event('input', { bubbles: true }));
                        return;
                    }

                    if (target.classList.contains('mystore_quick_add_btn')) {
                        var productId = card.getAttribute('data-product-id') || '';
                        var quantity = parseInt(qtyInput.value || '1', 10);
                        if (!ajaxUrl || !nonce || !productId || isNaN(quantity) || quantity < 1) {
                            return;
                        }

                        target.setAttribute('disabled', 'disabled');
                        var originalLabel = target.textContent || 'Add to Cart';
                        target.textContent = 'Adding...';

                        var body = new URLSearchParams();
                        body.set('action', 'mystore_quick_add');
                        body.set('nonce', nonce);
                        body.set('product_id', productId);
                        body.set('quantity', String(Math.min(500, quantity)));

                        window.fetch(ajaxUrl, {
                            method: 'POST',
                            credentials: 'same-origin',
                            headers: {
                                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
                            },
                            body: body.toString()
                        })
                            .then(function (res) { return res.json(); })
                            .then(function (payload) {
                                if (statusEl) {
                                    statusEl.textContent = (payload && payload.data && payload.data.message)
                                        ? String(payload.data.message)
                                        : 'Cart updated.';
                                }
                                target.textContent = 'Added \u2713';
                                window.setTimeout(function () {
                                    target.textContent = originalLabel;
                                    target.removeAttribute('disabled');
                                }, 1400);
                            })
                            .catch(function () {
                                if (statusEl) {
                                    statusEl.textContent = 'Unable to add item right now. Please try again.';
                                }
                                target.textContent = originalLabel;
                                target.removeAttribute('disabled');
                            });
                    }
                });
            });
        },

        bindDeliveryPreview: function () {
            var widgets = document.querySelectorAll('[data-mystore-delivery-widget]');
            var messages = {
                morning: 'Morning route leaves Limuru plant at 5:45 AM.',
                afternoon: 'Afternoon cold-chain truck departs Limuru at 11:30 AM.',
                evening: 'Evening express dispatch arrives before 7:30 PM.'
            };

            widgets.forEach(function (widget) {
                var select = widget.querySelector('.mystore_window_select');
                var etaEl = widget.querySelector('.mystore_delivery_eta_msg');
                if (!(select instanceof HTMLSelectElement) || !etaEl) {
                    return;
                }
                select.addEventListener('change', function () {
                    etaEl.textContent = messages[select.value] || messages.morning;
                });
            });
        }
    };

    window.mystoreFrontend = mystoreFrontend;
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            mystoreFrontend.init();
        });
    } else {
        mystoreFrontend.init();
    }
}(window, document));
