/*global ECommerce _config*/
// Note: This should likely be its own data store, but let's keep it simple for now

const ECommerce = window.ECommerce || {};

(function ECommerceWrapper($) {
    var authToken; // Ideally this isn't an authToken
    ECommerce.authToken.then(function setAuthToken(token) {
        if (token) {
            authToken = token;
        } else {
            window.location.href = '/signin.html';
        }
    }).catch(function handleTokenError(error) {
        alert(error); // Shame on me for using alerts
        window.location.href = '/signin.html'; // Routing?
    });

    /**
     * @name handleCreateProduct
     * @param {object} event - jQuery event object
     */

    function handleCreateProduct(event) {
        const product = {
            title: $('#productTitleInput').val(),
            price: $('#productPriceInput').val(),
            currencyCode: 'USD'
        };
        const productErrors = validateProduct(product)
        if (productErrors.length) {
            alert("Oh no baby what is you doin'?");
        } else {
            createProduct(product); 
        }
    }

    /**
     * @name validateProduct
     * @param {object} product - Product object with price, title, and currency code
     * @description - Honestly, a very lazy validation
     */

    function validateProduct(product) {
        const errors = [];
        const { title } = product;
        let { price } = product;
        price = parseFloat(price);
        const titleRegex = new RegExp('/^[A-z]{1,20}$/');
        if (!titleRegex.test(title)) {
            errors.push('title');
        }
        if (!price) {
            // Price wasn't even a number!
            errors.push('price');
            return errors; // Jump out of the validation now since the price wasn't even a number
        }

        if (price * -1 >= 0) {
            // They entered in 0 or a negative number
            errors.push('price');
        }

        if (price > 100 || price < 0) {
            errors.push('price');
        }

        return errors;
    }

    function createProduct(product) {
        $.ajax({
            method: 'POST',
            url: _config.api.invokeUrl + '/product',
            headers: {
                Authorization: authToken
            },
            data: JSON.stringify({
                productAttributes: product
            }),
            contentType: 'application/json',
            success: completeRequest,
            error: function ajaxError(jqXHR, textStatus, errorThrown) {
                console.error('Error creating product: ', textStatus, ', Details: ', errorThrown);
                console.error('Response: ', jqXHR.responseText);
                alert('An error occurred when creating your product:\n' + jqXHR.responseText);
            }
        });
    }
    function completeRequest(result) {
        console.log('Response received from API: ', result);
        displayUpdate(result.responseText);
    }

    function displayUpdate(text) {
        $('#updates').append($('<li>' + text + '</li>'));
    }

    $(function onDocReady() {
        $('#createProduct').click(handleCreateProduct);
    });
}(jQuery));
