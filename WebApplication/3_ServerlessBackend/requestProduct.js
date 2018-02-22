const AWS = require('aws-sdk');

const ddb = new AWS.DynamoDB.DocumentClient();

exports.handler = (event, context, callback) => {
    if (!event.requestContext.authorizer) {
        errorResponse('Authorization is not configured', context.awsRequestId, callback);
        return;
    }

    console.log('Received event:', event);

    const username = event.requestContext.authorizer.claims['cognito:username'];

    const requestBody = JSON.parse(event.body);

    const { productAttributes } = requestBody;

    const errors = validateProduct(productAttributes);

    if (!errors.length) {
        saveProductToInventory(productAttributes, username).then(() => {
            callback(null, {
                statusCode: 201,
                body: JSON.stringify({
                    ProductId: productAttributes.id,
                    Product: productAttributes,
                }),
                headers: {
                    'Access-Control-Allow-Origin': '*',
                },
            });
        }).catch((error) => {
            console.error(error);
            errorResponse(error.message, context.awsRequestId, callback);
        });
    } else {
        let error = {
            message: 'Uh, something went wrong, I\'m tired.',
        };
        errorResponse(error.message, context.awsRequestId, callback);
    }

}

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

function saveProductToInventory(product, username) {
    return ddb.put({
        TableName: 'Products',
        Item: {
            ProductId: product.id,
            User: username,
            Product: product,
            ProductTitle: product.title,
            ProductPrice: product.price,
            ProductCurrencyCode: product.currencyCode,
            RequestTime: new Date().toISOString(),
        },
    }).promise();
}

function errorResponse(errorMessage, awsRequestId, callback) {
    callback(null, {
        statusCode: 500,
        body: JSON.stringify({
            Error: errorMessage,
            Reference: awsRequestId,
        }),
        headers: {
            'Access-Control-Allow-Origin': '*',
        },
    });
}
