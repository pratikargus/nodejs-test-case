'use strict';

/*global Stripe:true*/
/*global $form:true*/

//set Public key for Stripe payments
Stripe.setPublishableKey('pk_test_pfxgyk9qzgWxywxEj7ECJx2z');
var isSubmit = false;
$(document).ready(function() {
    $('#submittransaction').click(function() {
        console.log('ok');
        if (!isSubmit) {
            Stripe.card.createToken({
                number: $('.card-number').val(),
                cvc: $('.card-cvc').val(),
                exp_month: $('.card-expiry-month').val(),
                exp_year: $('.card-expiry-year').val()
            }, function(status, response) {
                if (response.error) {
                    // Show the errors on the form
                    $('.payment-errors').text(response.error.message);
                }
                else {
                    // response contains id and card, which contains additional card details
                    var token = response.id;
                    // Insert the token into the form so it gets submitted to the server
                    $('form').append($('<input type="hidden" name="stripeToken" />').val(token));
                    // and submit
                    $.ajax({
                        url: '/createtransaction',
                        type: 'POST',
                        headers: {
                            'x-access-token': $('#token').html()
                        },
                        data: {
                            amount: $('#amount').val(),
                            currency: $('#currency').val(),
                            stripeToken: token
                        }
                    }).done(function(response) {
                        if (response.message) {
                            $('.payment-errors').html(response.message);
                            $('.payment-errors').removeClass('text-danger');
                            $('.payment-errors').addClass('text-success');
                        }
                    }).error(function(err) {
                        if (err.responseText) {
                            var responseText = JSON.parse(err.responseText);
                            $('.payment-errors').html(responseText.message);
                            $('.payment-errors').removeClass('text-success');
                            $('.payment-errors').addClass('text-danger');
                        }
                    });
                }

            });
        }

    });
    //Retrieve saved cards
    if (window.location.pathname === '/authenticate') {
        $.ajax({
            url: '/getsavedcards',
            type: 'GET',
            headers: {
                'x-access-token': $('#token').html()
            }
        }).done(function(response) {
            console.log('new script');
            if (response && response.data && response.data.length > 0) {
                $('.existing-cards').html("");
                for (var i = 0; i < response.data.length; i++) {
                    var data = response.data[i];
                    $(".existing-cards").append('<div class="well well-sm col-xs-12"><div class="col-xs-12"><input type="radio" name="savedcard" value="' + data.cardId + '"/> <label class="control-label-static"><b>' + data.brand + '</b> ending with ' + data.last4 + '</label></div><div class="col-xs-12" style="padding-left:32px;">Expiry Date : ' + data.exp_month + '/' + data.exp_year + '</div></div>');
                }


                //Reset radio button on click of new payment method
                $('.new-payment-method input').on('focus', function() {
                    $('input[name=savedcard]').attr('checked', false);
                });
            }
        });


        $('#processExistingCard').click(function() {
            var cardId = $('input[name=savedcard]:checked').val();
            if (cardId) {
                $.ajax({
                    url: '/createtransaction',
                    type: 'POST',
                    headers: {
                        'x-access-token': $('#token').html()
                    },
                    data: {
                        amount: $('#amount2').val(),
                        currency: $('#currency2').val(),
                        cardId: cardId
                    }
                }).done(function(response) {
                    if (response.message) {
                        $('.payment-errors2').html(response.message);
                        $('.payment-errors2').removeClass('text-danger');
                        $('.payment-errors2').addClass('text-success');
                    }
                }).error(function(err) {
                    if (err.responseText) {
                        var responseText = JSON.parse(err.responseText);
                        $('.payment-errors2').html(responseText.message);
                        $('.payment-errors2').removeClass('text-success');
                        $('.payment-errors2').addClass('text-danger');
                    }
                });

            } else {
                alert('Please select any saved card.');
            }

        });
    }
});
