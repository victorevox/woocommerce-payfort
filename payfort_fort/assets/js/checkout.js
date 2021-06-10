

jQuery('form.checkout').on('submit', function (e){
    var paymentMethod = jQuery('input[name=payment_method]:checked').val();
    if("payfort" === paymentMethod || "payfort_fort_sadad" === paymentMethod || "payfort_fort_qpay" === paymentMethod || "payfort_fort_installments" === paymentMethod) {
        e.preventDefault();
        return fortFormHandler(jQuery(this));
    }
});
jQuery('form#order_review').on('submit', function () {
    return fortFormHandler(jQuery(this));
});

function showError(form, data) {
    // Remove notices from all sources
    jQuery( '.woocommerce-error, .woocommerce-message' ).remove();

    // Add new errors returned by this event
    if ( data.messages ) {
            form.prepend( '<div class="woocommerce-NoticeGroup-updateOrderReview">' + data.messages + '</div>' );
    } else {
            form.prepend( data );
    }

    // Lose focus for all fields
    form.find( '.input-text, select, input:checkbox' ).blur();

    // Scroll to top
    jQuery( 'html, body' ).animate( {
            scrollTop: ( jQuery( form ).offset().top - 100 )
    }, 1000 );
}
var form = jQuery("form.checkout");
form.length ? (form.bind("checkout_place_order_payfort checkout_place_order_payfort_fort_sadad checkout_place_order_qpay checkout_place_order_payfort_fort_installments", function() {
    //return fortFormHandler(jQuery(this));
    return !1;
})) : jQuery("form#order_review").submit(function() {
    var paymentMethod = jQuery("#order_review input[name=payment_method]:checked").val();
    return "payfort" === paymentMethod || "payfort_fort_sadad" === paymentMethod || "payfort_fort_qpay" === paymentMethod || "payfort_fort_installments" === paymentMethod ? fortFormHandler(jQuery(this)) : void 0;
});

function fortFormHandler(form) {
    if (form.is(".processing")) return !1;
    return initPayfortFortPayment(form);
}

function isMerchantPageMethod(pament_method) {
    var isCc            = pament_method == 'payfort' ? true : false;
    var isInstallments  = pament_method == 'payfort_fort_installments' ? true : false;
    if((isCc && jQuery('#payfort_fort_cc_integration_type').val() == 'merchantPage') || (isInstallments && jQuery('#payfort_fort_installments_integration_type').val() == 'merchantPage')) {
        return true;
    }
    return false;
}

function isMerchantPage2Method(pament_method) {
    var isCc = pament_method == 'payfort' ? true : false;
    if(isCc && jQuery('#payfort_fort_cc_integration_type').val() == 'merchantPage2') {
        return true;
    }
    return false;
}

function initPayfortFortPayment(form) {
    var data = jQuery(form).serialize();
    var pament_method = form.find('input[name="payment_method"]:checked').val();
    var isSadad = pament_method == 'payfort_fort_sadad' ? true : false;
    var isNAPS = pament_method == 'payfort_fort_qpay' ? true : false;
    var isInstallments = pament_method == 'payfort_fort_installments' ? true : false;
    if(isMerchantPage2Method(pament_method)) {
        //validate credit card form
        var isValid = payfortFortMerchantPage2.validateCcForm(form);
        if(!isValid) {
            return !1;
        }
    }
    data += '&SADAD=' + isSadad;
    data += '&NAPS=' + isNAPS;
    var ajaxUrl = wc_checkout_params.checkout_url;
//    if(jQuery('form#order_review').size() == 0){
//        ajaxUrl = '?wc-ajax=checkout';
//    }
    jQuery.ajax({
        'url': ajaxUrl,
        'type': 'POST',
        'dataType': 'json',
        'data': data,
        'async': false
    }).always(function (response) {
        data = '';
        if(response.form || response.messages) {
            data = response || response.messages;
        }
        else{
            var code = response.responseText;
            var newstring; 
            try {
              newstring = code.replace(/<script[^>]*>(.*)<\/script>/, "");
            } catch (error) {
              //error catched
            }
            if (newstring.indexOf("<!--WC_START-->") >= 0) {
                    newstring = newstring.split("<!--WC_START-->")[1];
            }
            if (newstring.indexOf("<!--WC_END-->") >= 0) {
                    newstring = newstring.split("<!--WC_END-->")[0];
            }
            try {
                data = jQuery.parseJSON( newstring );
            }
            catch(e) {}
        }
        if(data.result == 'failure') {
            showError(form, data);
            return !1;
        }
        if (data.form) {
            // be able to submit files from checkout
            var fd = new FormData();
            let hasFiles = false;

            //searches in the form
            var file = jQuery(form).find('input[type="file"]');
            file.each((i, element) => {
                var individual_file = element.files[0];
                if(individual_file != undefined) {
                    hasFiles = true;
                    var field_name = jQuery(element).attr("name");
                    fd.append(field_name, individual_file);
                }
            })
            let nonce = wc_checkout_params.update_order_review_nonce || jQuery('#woocommerce-process-checkout-nonce').val();
            // fd.append('action', 'upload_image');
            if(hasFiles > 0) {
                fd.append('security', nonce);
                fd.append('post_data', jQuery(form).serialize());
                let referEl = jQuery('input[name="_wp_http_referer"]');
                let url = referEl.val();
                jQuery.ajax({
                    type: 'POST',
                    url: url || ajaxurl,  // nb-----------------have you got a variable for ajaxurl? if not insert var ajaxurl = '<?php echo admin_url('admin-ajax.php'); ?>'; somewhere in your template...or google the wp way!
                    data: fd,
                    contentType: false,
                    processData: false,
                    success: function(response){
                        //just spit out the response to the console to catch php errors etc..
                        console.log(response);
                    }
                });
            }

            return;

            //
            jQuery('#frm_payfort_fort_payment').remove();
            jQuery('body').append(data.form);
            window.success = true;
            if(isMerchantPage2Method(pament_method)) {
                payfortFortMerchantPage2.submitMerchantPage();
            }
            else if(isMerchantPageMethod(pament_method)) {
                payfortFortMerchantPage.showMerchantPage(jQuery('#frm_payfort_fort_payment').attr('action'));
            }
            else{                   
                jQuery( "#frm_payfort_fort_payment" ).submit();
            }
        }
    });
    return !1;
}
