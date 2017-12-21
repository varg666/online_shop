const express = require('express');
const fs = require('fs');
const path = require('path');
const Router = express.Router;
const app = express();
const cors = require('cors');
const mysql = require('mysql');

const frontendDirectoryPath = path.resolve(__dirname, './../static');

console.log('static resource at: ' + frontendDirectoryPath);
app.use(express.static(frontendDirectoryPath));
app.use(cors());
app.use(express.json());

// avoid hardcoded DB connection information at ALL COSTS!
// use the following command to start your server:
// MYSQL_PASSWORD=P455w0rd MYSQL_USER=root MYSQL_DB=x_shop npm run start-express-dev
const {
	MYSQL_PASSWORD = '',
	MYSQL_USER = 'root',
	MYSQL_DB = 'online_shop',
} = process.env;

console.info('MYSQL: user "%s", db "%s", pass length %s', MYSQL_USER, MYSQL_DB, MYSQL_PASSWORD.length);
var con = mysql.createConnection({
	host: 'localhost',
	user: MYSQL_USER,
	password: MYSQL_PASSWORD,
	database: MYSQL_DB
});


// always want to have /api in the beginning
const apiRouter = new Router();
app.use('/api', apiRouter);

apiRouter.get('/', (req, res) => {
	res.send({'shop-api': '1.0'});
});

apiRouter.get('/products', (req, res, next) => {
	con.query('select * from products', function(err, rows) {
		if (err) return next(err);

		console.log( rows );
		res.json( rows );
	});
});

apiRouter.get('/products', (req, res, next) => {
	con.query('select * from products', function(err, rows) {
		if (err) return next(err);

		console.log( rows );
		res.json( rows );
	});
});

apiRouter.get('/categories', (req, res, next) => {
	con.query('select * from product_categories', function(err, rows) {
		if (err) return next(err);

		console.log( rows );
		res.json( rows );
	});
});

apiRouter.get('/customers', function(req, res, next) {
	con.query('select * from customers where active = 1', function(err, rows) {
		if (err) return next(err);

		console.log( rows );
		res.json( rows );
	});
});

apiRouter.get('/payment_methods', function(req, res, next) {
	con.query('select * from payment_method', function(err, rows) {
		if (err) return next(err);

		console.log( rows );
		res.json( rows );
	});
});

apiRouter.put('/activate/:userid', function(req, res, next) {
	con.query('update customers set active = ? where id = ?',
		[req.body.status, req.params.userid],
		function(err, rows) {
		if (err) return next(err);

		console.log( rows );
		res.json( rows );
	});
});

apiRouter.post('/user', function(req, res, next) {

	con.query('select * from customers where email = ?',
		[req.body.email],
		function(err, rows) {
			if (err) return next(err);

			if( rows.length > 0 ) {
				res.json({error: 'Email already exists.'});
			}
			else {
				con.query(`insert into customers (firstname, lastname, birthdate, phone, city, street, email)
					values (?, ?, ?, ?, ?, ?, ?)`,
					[
					  req.body.firstname,
					  req.body.lastname,
					  req.body.birthdate,
					  req.body.phone,
					  req.body.city,
					  req.body.street,
					  req.body.email
					],
					function(err, rows) {
					  if (err) return next(err);

					  res.json( rows );
					}
				);
			}
		});
});

apiRouter.post('/order', function(req, res, next) {
	/* postpone to january ...
	con.query('insert into orders (customer_id, payment_id, created, paid) values (?, ?, now(), NULL)', [req.body.customerid, req.body.payment_id], function(err, rows) {

		const newOrderId = rows.insertId;
		var sql = 'insert into order_details () values ';

		res.json(rows);
	});
	*/

	fs.writeFile(path.resolve(__dirname, './../orders/orders'+Date.now()+'.txt'), JSON.stringify(req.body),
		(err) => {
			if (err) return next(err);

			res.json({success:'order saved'});
		});
});

apiRouter.put('/user/:userid', function(req, res, next) {
	console.log('userid: ' + req.params.userid);
	var sql = 'update customers set ';
	var i = 1;
	var bodyLength = Object.keys(req.body).length;
	var values = [];
	for(var field in req.body) {
		sql += field + ' = ?';
		if(i < bodyLength)
			sql += ',';
		i++;
		values.push( req.body[field] );
	}

	sql += ' where id = ?';
	values.push( req.params.userid );
	con.query(sql,
		values,
		function(err, rows) {
		if (err) return next(err);

		console.log( rows );
		res.json( rows );
	});
});

apiRouter.delete('/user/:userid', function(req, res, next) {
	con.query('update customers set deleted = now() where id = ?', [req.params.userid],
		function(err, rows) {
		if (err) return next(err);

		console.log( rows );
		res.json( rows );
	});
});

apiRouter.use(function(req, res, next) {
	const err = new Error('Not Found');
	err.code = 404;
	next(err);
});

apiRouter.use(function (err, req, res, next) {
	console.warn('Error occured for "%s":\n%s', req.url, err.stack);
	res.json(err);
});

// avoid starting server if the connection to the DB cannot be established
con.connect(function (err) {
	if (err) throw err;

	app.listen( 9090, (err) => {
		if(err) throw err;
		console.log('Server started on port 9090');
	});
});
