/* eslint-disable */

//  import core files
import $ from 'jquery';
import 'bootstrap/js/src';
import './styles.scss';
import navbarTemplate from './templates/navbar.html';
import modalTemplate from './templates/modal.html';
import activationModalTemplate from './templates/activationmodal.html';
import resetPasswordModalTemplate from './templates/resetpasswordmodal.html';
import checkoutTemplate from './templates/checkout.html';
import paymentMethodRadioTemplate from './templates/payment-method-radio.html';
import mkCarousel from './carousel';
import refreshProducts from './products';

//  this is the function which is used when the page loads
$(() => {
  // for convenience we create a jQuery object in which
  //  we will be able to put the content of our pages
  const $pageContent = $('<div class="page-content"></div>');

  let categories = [];
  let products = [];

  function fillPageContent(wantedCategory = -1) {
    $pageContent.empty();

    // ------------------------------------------------------------
    //  populate carousel with categories
    const $carousel = mkCarousel(categories);
    // we put the page element (carousel inside the $pageContent)
    $pageContent.append($carousel);
    $carousel.carousel();

    //  Iterate over the categories and append to navbar
    const $navbarNav = $('.navbar-nav')
      .empty()
      .append(`
        <li class="nav-item">
          <a class="nav-link" data-id="-1" data-name="All products" href="#">
            All Products
          </a>
        </li>`);
    categories.forEach((category, number) => {
      $navbarNav
        .append(`
          <li class="nav-item">
            <a class="nav-link" data-id="${number}" data-name="${category.name}" href="#">${category.name}</a>
          </li>`);
    });
    // ------------------------------------------------------------
    // append products-grid inside the $pageContent
    $pageContent
      .append(`<div class="infobox"><h2 id="infos">All products (${Object.keys(products).length})</h2></div>`)
      .append('<div id="products-grid" class="container-fluid"></div>');

    //  populate products-grid with products
    $('#products-grid').append('<div class="row"></div>');
    refreshProducts(products, wantedCategory);

    // click event handler on nav-links
    $('.nav-link').click((eventObj) => {
      eventObj.preventDefault();
      const { target } = eventObj;
      const categoryId = target.getAttribute('data-id');
      $('.navbar-nav .active').removeClass('active');
      $(target).closest('li').addClass('active');

      fillPageContent(categoryId);
    });
  }

  $('.loginerror').hide();

  //  show nav button only for logged users
  function loggedUser() {
    $('#user-signed-link').show();
    $('#user-signout-link').show();
    $('#user-signin-link').hide();
    $('#user-signup-link').hide();
  }

  // show nav button for guest users
  function guestUser() {
    $('#user-signed-link').hide();
    $('#user-signout-link').hide();
    $('#user-signin-link').show();
    $('#user-signup-link').show();
  }

  $('#root')
    // we keep that outside of the page content
    // because when we click on product details
    // we replace its content
    .append(activationModalTemplate)
    .append(resetPasswordModalTemplate)
    // (rather than creating the whole modal again)
    .append(modalTemplate)
    // the navbar stays accross the pages so
    // we keep it outside of the page content too
    .append(navbarTemplate)
    // we add the $pageContent here and
    // we will modify its own content later
    .append($pageContent);

  // We check if the user is logged in or not - usefull on reload page
  const notGuest = JSON.parse(localStorage.getItem('user'));
  if (notGuest === null) {
    guestUser();
  } else {
    loggedUser();
    $('.logged').text(notGuest.firstname);
  }

  var urlParts = window.location.href.split('/');
  var lastPart = urlParts[urlParts.length - 1];

  if(lastPart.startsWith('activate')) {
    var activationCode = lastPart.split('=')[1];
   
    $.ajax({
      url: "http://localhost:9090/api/activate/" + activationCode,
      method: "PUT",
      contentType: "application/json",
      dataType: "json",
    })
    .done(function(data) {
      console.log('success', data);

      if(data.error === 0) {
        $('#activationModal').modal('show');
      }
      else {
        console.log('user activation cancelled');
      }
    })
    .fail(function(xhr) {
      console.log('error', xhr);
    });      


    console.log('activationCode: ' + activationCode);   
  }

  if(lastPart.startsWith('resetpassword')) {    
    $('#resetPasswordModal').modal({backdrop: 'static', keyboard: false})    
  }
  
  // in order to handle errors in consistent manner
  function handleAJAXError(xhr, status, error) {
    $pageContent
      .empty()
      .append(`<div>Ajax Error categories: ${error}</div>`);
  }

  //  Hiding the cart and forms on page load
  $('.shopping-cart').hide();
  $('.user-login').hide();
  $('.user-registration').hide();
  $('.user-update').hide();

  // the #cart element is located in the navbar
  // (which has been add above)
  $('#cart').click(((e) => {
    e.preventDefault();
    $('.shopping-cart').toggle('slow');
    if ($('.user-login').is(':visible')) {
      $('.user-login').hide();
    }
    if ($('.user-registration').is(':visible')) {
      $('.user-registration').hide();
    }
    if ($('.user-update').is(':visible')) {
      $('.user-update').hide();
    }
  }));

  // the #user element is also located in the navbar
  // (which has been add above)
  $('#user-signin-link, .signin-link').click(((e) => {
    e.preventDefault();
    $('.user-login').toggle('slow');
    $('#inputUsername').focus();
    if ($('.shopping-cart').is(':visible')) {
      $('.shopping-cart').hide();
    }
    if ($('.user-registration').is(':visible')) {
      $('.user-registration').hide();
    }
    if ($('.user-update').is(':visible')) {
      $('.user-update').hide();
    }
    $('#form-resetpassword').hide();
  }));

  $('#passwordreset-link, .passwordreset-link').click( (e) => {
    e.preventDefault();
    $('#form-resetpassword').show();
    $('#form-signin').hide();
  });

  // preventing default Submit event
  $('#form-signin').on('submit', ((e) => {
    e.preventDefault();
    // randomly select one user from the database at the beginning,
    // so that we have one user for ordering and checkout
    localStorage.removeItem('user');
      $.ajax({
        url: "http://localhost:9090/api/login",
        method: "POST",
        contentType: "application/json",
        dataType: "json",
        data: JSON.stringify({
           email: $('#form-signin input[name=email]').val(), 
           password: $('#form-signin input[name=password]').val()
        })
      })
      .done(function(data) {
        console.log('success', data);

        if(data.err) {
          $('.loginerror').show();
          $('.errmsg').text(data.err);
        }
        else {
          const user = data;
          console.log( $(".user-registration-header form").attr('id') );
          loggedUser();
          $('.logged').text(user.firstname);
          localStorage.setItem('user', JSON.stringify(user));
          $('.user-login').toggle('slow');
        }
      })
      .fail(function(xhr) {
        console.log('error', xhr);
      });      
  }));

  $('#form-resetpassword').on('submit', ((e) => {
    e.preventDefault();
      $.ajax({
        url: "http://localhost:9090/api/resetpassword",
        method: "POST",
        contentType: "application/json",
        dataType: "json",
        data: JSON.stringify({
           email: $('#form-resetpassword input[name=email]').val()
        })
      })
      .done(function(data) {
        console.log('success', data);

        if(data) {
          $('.user-login').toggle('slow');
        }
        else {

        }
      })
      .fail(function(xhr) {
        console.log('error', xhr);
      });      
  }));

  // click on signup button
  $('#user-signup-link, .signup-link').click(((e) => {
    e.preventDefault();
    console.log( $(".user-registration-header form").attr('id') );
    $('.user-registration').toggle('slow');
    if ($('.shopping-cart').is(':visible')) {
      $('.shopping-cart').hide();
    }
    if ($('.user-login').is(':visible')) {
      $('.user-login').hide();
    }
    if ($('.user-update').is(':visible')) {
      $('.user-update').hide();
    }
  }));


  // click on signed-in button to edit user info
  $('#user-signed-link').click(((e) => {
    e.preventDefault();
    console.log( $(".user-registration-header form").attr('id') );
    $('.user-update').toggle('slow');
    if ($('.shopping-cart').is(':visible')) {
      $('.shopping-cart').hide();
    }
    if ($('.user-login').is(':visible')) {
      $('.user-login').hide();
    }
    // get the user information from the local storage
    const user = JSON.parse(localStorage.getItem('user'));
    // change the field values accordingly


    $('#form-edit-user').append('<input type="hidden" name="id" />');
    $('#form-edit-user [name="id"]').val(`${user.id}`);
    $('#form-edit-user [name="firstname"]').val(`${user.firstname}`);
    $('#form-edit-user [name="lastname"]').val(`${user.lastname}`);
    $('#form-edit-user [name="birthdate"]').val(`${user.birthdate.substring(0,10)}`);
    $('#form-edit-user [name="street"]').val(`${user.street}`);
    $('#form-edit-user [name="city"]').val(`${user.city}`);
    $('#form-edit-user [name="postal"]').val(`${user.postal}`);
    $('#form-edit-user [name="phone"]').val(`${user.phone}`);
    $('#form-edit-user [name="email"]').val(`${user.email}`);
    $('#form-edit-user [name="password"]').val();
  }));

  //  click on signout button
  $('#user-signout').click(((e) => {
    e.preventDefault();
    guestUser();
    
    console.log( $(".user-registration-header form").attr('id') );
    
    $('.checkout-proceed').attr('disabled', true);
    $('.checkout-user-alert').show();
    if($('.user-registration').is(':visible'))
      $('.user-registration').hide('slow');
    localStorage.removeItem('user');
  }));

  // signup form submit
  $('#form-signup').on('submit', ((e) => {
    e.preventDefault();
    // retrieve registration info from the form and
    // save a new user in localStorage
    localStorage.removeItem('user');
    const user = {};
    user.firstname = $('#form-signup input[name=firstname]').val();
    user.lastname = $('#form-signup input[name=lastname]').val();
    user.street = $('#form-signup input[name=street]').val();
    user.city = $('#form-signup input[name=city]').val();
    user.postal = $('#form-signup input[name=postal]').val();
    user.birthdate = $('#form-signup input[name=birthdate]').val();
    user.email = $('#form-signup input[name=email]').val();
    user.phone = $('#form-signup input[name=phone]').val();
    user.password = $('#form-signup input[name=password]').val();

      $.ajax({
        url: "http://localhost:9090/api/register",
        method: "POST",
        contentType: "application/json",
        dataType: "json",
        data: JSON.stringify(user)
      })
      .done(function(data) {
        console.log('success', data);

        if(data.err || data.code) {
          $('.signerror').show();
          $('.signerrmsg').text(data.err);
        }
        else {
          const user = data;
          localStorage.setItem('user', JSON.stringify(user));
          loggedUser();
          $('.logged').text(user.firstname);
          $('.user-registration').toggle('slow');
          $('signerror').hide()
        }
      })
      .fail(function(xhr) {
        console.log('error', xhr);
      });      
  }));

  $('.pass').focusout(() => {
          var pass = $('#inputUpdPassword').val();
          var pass2 = $('#inputUpdRetypePassword').val();
          if(pass !== pass2){
            $('.upderror').show();
            $('.upderrmsg').text('the passwords didn\'t match!');
          }else{
            $('.upderror').hide();
          }
      });
  // signup form submit
  $('#form-edit-user').on('submit', ((e) => {
    e.preventDefault();
    // retrieve registration info from the form and
    // save a new user in localStorage
    localStorage.removeItem('user');
    const user = {};
    user.id = $('#form-edit-user input[name=id]').val();
    user.firstname = $('#form-edit-user input[name=firstname]').val();
    user.lastname = $('#form-edit-user input[name=lastname]').val();
    user.street = $('#form-edit-user input[name=street]').val();
    user.city = $('#form-edit-user input[name=city]').val();
    user.postal = $('#form-edit-user input[name=postal]').val();
    user.birthdate = $('#form-edit-user input[name=birthdate]').val();
    user.email = $('#form-edit-user input[name=email]').val();
    user.phone = $('#form-edit-user input[name=phone]').val();
    user.password = $('#form-edit-user input[name=password]').val();

      $.ajax({
        url: "http://localhost:9090/api/update",
        method: "POST",
        contentType: "application/json",
        dataType: "json",
        data: JSON.stringify(user)
      })
      .done(function(data) {
        console.log('success', data);

        if(data.err) {
          $('.signerror').show();
          $('.signerrmsg').text(data.err);
        }
        else {
          const user = data;
          localStorage.setItem('user', JSON.stringify(user));
          //  loggedUser();
          $('.logged').text(user.firstname);
          $('.user-update').toggle('slow');
          $('signerror').hide()
        }
      })
      .fail(function(xhr) {
        console.log('error', xhr);
      });      
  }));


  // the checkout button is located in the navbar too
  $('.checkout-proceed').click(() => {
    // create a jQuery object filled with the checkoutTemplate
    const $checkout = $(checkoutTemplate);
    // get the user information from the local storage
    const user = JSON.parse(localStorage.getItem('user'));
    // change the field values accordingly
    $checkout.find('[name="user-name"]').val(`${user.firstname} ${user.lastname}`);
    $checkout.find('[name="user-street"]').val(user.street);
    $checkout.find('[name="user-city"]').val(`${user.postal} ${user.city}`);

    const storedProducts = JSON.parse(localStorage.getItem('cart'));
    let total = 0;
    const $productsList = $checkout.find('.products-list');
    storedProducts.forEach((product) => {
      $productsList.append(`<li>
        <span class="product-name">${product.name}</span>
        <span class="product-price">${product.price}€</span>
        <span class="product-quantity">${product.quantity}</span>
      </li>`);

      total += parseInt(product.price, 10) * product.quantity;
    });
    $checkout.find('.cart-total').text(`Total: ${total}€`);

    // we attach a click listener on the "buy" button
    $checkout.find('.checkout-buy').click((evt) => {
      // prevent the default behavior (wich would submit the form)
      evt.preventDefault();
      // we need a JSON string of the data to be sent
      const data = JSON.stringify({
        products: storedProducts,
        user: {
          id: user.id,
          email: user.email,
          name: $checkout.find('[name="user-name"]').val(),
          street: $checkout.find('[name="user-street"]').val(),
          city: $checkout.find('[name="user-city"]').val(),
        },
        payment_method: $checkout.find('[name="payment"]:checked').val(),
      });
      // to send a POST request to the server
      var userToken = JSON.parse(localStorage.getItem('user')).token;
      $.ajax('http://localhost:9090/api/order', {
        method: 'POST',
        headers: {
          authorization: 'Bearer ' + userToken
        },        
        // the content-type of the request has to be application/json
        // in order for the spaerver to be able to read the body (of the request)
        contentType: 'application/json',
        data,
      })
        .done(() => {
          $checkout
            .empty()
            .append(`<div class="alert alert-success">
              The order has been placed!
            </div>`);
        })
        .fail(() => {
          $checkout
            .empty()
            .append(`<div class="alert alert-danger">
              An error occured, sorry.
            </div>`);
        });
    });


    $checkout.find('.checkout-cancel').click(() => {
      fillPageContent();
    });


    // we put the $checkout in the page
    // (a text "Payment methods are loading" is visible)
    $pageContent
      .empty()
      .append($checkout);

    // we clear the .payment-methods (in which the loading text is)
    // and keep a reference ($paymentMethods) for later access
    const $paymentMethods = $checkout
      .find('.payment-methods')
      .empty();

    $.ajax('//localhost:9090/api/payment_methods')
      .done((data) => {
        // for each payment methods returned by the API
        data.forEach((paymentMethod) => {
          // we create a jQuery object
          const $paymentMethod = $(paymentMethodRadioTemplate);
          // in which we alterate the wanted attributes...
          $paymentMethod.find('input').attr('value', paymentMethod.id);
          // ...and texts
          // It's important to do the ".find()" on the smallest set possible
          // if we have used .find() on $checkout,
          // it would have unwanted side effects (because the $checkout has several 'span's)
          $paymentMethod.find('span').text(paymentMethod.name);
          // finally we append the payment method to its container
          $paymentMethods.append($paymentMethod);
        });
      })
      // we could also use the handleAJAXError here
      .fail((xhr, status, error) => {
        $paymentMethods.text(error.message);
      });

    // close the cart widget
    $('.shopping-cart').hide();
  });

  // we will trick the $pageContent to add a padding top
  // equivalent to the navbar outer height
  // (don't forget to remove styles which were supposed to do that in your SCSS)
  $pageContent.css('padding-top', $('.navbar').outerHeight());

  // read categories
  $.ajax('http://localhost:9090/api/categories')
    .done((data) => {
      // store the data in the variable declared above
      categories = data;
      fillPageContent();
    })
    //  or fail trying
    .fail(handleAJAXError);

  // ajax req and append products grid
  $.ajax('http://localhost:9090/api/products')
    .done((data) => {
      // store the data in the variable declared above
      products = data;
      fillPageContent();
    })
    //  or fail trying
    .fail(handleAJAXError);
  // End
});


