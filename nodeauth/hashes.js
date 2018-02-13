var bcrypt = require('bcrypt');

/*
bcrypt.hash('foobar', 0, function(err, hash) {
	console.log('hash: ' + hash);


});
*/


	bcrypt.compare('foobar', '$2a$10$RvYB2XGbE0/AsOXLLh0qp.NAHENf1VJSubVRAB1bwJ1fvkLHSUgQm', function(err, res) {
		if(res) {
			console.log('passwords match');
		}
		else {
			console.log('passwords do not match');
		}
	});
	

	'$2a$10$uyU2j9Fi.ZGwbgbomdRDveK4DUq5kAMMeVt/fTbLTLP0hCGjia2Pe'.length