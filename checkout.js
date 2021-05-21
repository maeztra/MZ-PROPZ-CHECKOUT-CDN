(function () {
    localStorage.setItem('@propz/last-state-items', JSON.stringify(vtexjs.checkout.orderForm.items));
    localStorage.setItem('@propz/last-state-profile', JSON.stringify(vtexjs.checkout.orderForm.clientProfileData));
    sendToPropz(vtexjs.checkout.orderForm);

    $(window).on('orderFormUpdated.vtex', function (evt, orderForm) {
        var lastStateItems = JSON.parse(localStorage.getItem('@propz/last-state-items'));
        var lastStateProfile = JSON.parse(localStorage.getItem('@propz/last-state-profile'));

        orderForm.items.forEach(function (item, index) {
            if ((lastStateItems[index].sellingPrice != item.sellingPrice) || (lastStateItems[index].quantity != item.quantity)) {
                setTimeout(sendToPropz(orderForm), 500);
            }
        })

        if (orderForm.clientProfileData != null) {
            var lastStateDocument = (lastStateProfile != null) ? ((typeof lastStateProfile.document == 'undefined') ? null : lastStateProfile.document) : null;
            if (orderForm.clientProfileData.document != lastStateDocument) {
                sendToPropz(orderForm);
            }
        }
    });
})()

function sendToPropz(orderForm) {
    getSession().then(function (session) {

        let payload = {
            sessionId: session.id,
            customer: {
                customerId: orderForm.clientProfileData?.document
            },
            ticket: {
                ticketId: orderForm.orderFormId,
                amount: 0,
                date: (new Date()).toISOString(),
                blockUpdate: 0,
                items: []
            }
        };

        orderForm.totalizers.forEach(function (total, index) {
            payload.ticket.amount = payload.ticket.amount + parseFloat(total.value / 100);
        })

        orderForm.items.forEach(function (item, index) {
            let thisItem = {
                "itemId": index,
                "ean": item.ean,
                "unitPrice": (item.price / 100),
                "unitSize": item.measurementUnit,
                "quantity": item.quantity,
                "blockUpdate": 0
            }

            payload.ticket.items.push(thisItem);
        })

        const url = '/put-price?orderFormId=' + orderForm.orderFormId


        $.ajax({
            url: url,
            type: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify(payload)
        }).done(function (e) {
            localStorage.setItem('@propz/post-price', JSON.stringify(e));
            vtexjs.checkout.getOrderForm().then(function (orderForm) {
                localStorage.setItem('@propz/last-state-items', JSON.stringify(orderForm.items));
                localStorage.setItem('@propz/last-state-profile', JSON.stringify(orderForm.clientProfileData));
            });
        }).fail(function (msg) {
        }).always(function (msg) {
        });
    })
}

function getSession() {
    return $.ajax("/api/sessions/?items=*").then(res => res)
}
