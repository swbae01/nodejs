require('dotenv').config();
const express = require('express');
const app = express();
const path = require('path');
const cors = require('cors');
const corsOptions = require('./config/corsOptions');
const { logger } = require('./middleware/logEvents');
const errorHandler = require('./middleware/errorHandler');
const verifyJWT = require('./middleware/verifyJWT');
const cookieParser = require('cookie-parser');
const credentials = require('./middleware/credentials');
const mongoose = require('mongoose');
const connectDB = require('./config/dbConn');
// fs and https 모듈 가져오기
const https = require("https");
const fs = require("fs");

const PORT = process.env.PORT || 3500;

const options = {
  key: fs.readFileSync("./cert.key"),
  cert: fs.readFileSync("./cert.crt"),
};

// Connect to MongoDB
connectDB();

app.use(logger);

// Handle options credentials check - before CORS !
// and fetch cookies credentials requirement
app.use(credentials);

//Cross Origin Resource Sharing
app.use(cors(corsOptions));

// built-in middleware to handle urlencoded data
// in other words, form data:
// 'content-type: application/x-www-form-urlencoded'
app.use(express.urlencoded({ extended: false }));

// built-in middleware for json
app.use(express.json());


// middleware for cookies
app.use(cookieParser());

// server static file
app.use('/', express.static(path.join(__dirname, '/public')));

//routes
app.use('/', require('./routes/root'));
app.use('/register', require('./routes/register'));
app.use('/auth', require('./routes/auth'));
app.use('/refresh', require('./routes/refresh'));
app.use('/logout', require('./routes/logout'));

app.use(verifyJWT);
app.use('/employees', require('./routes/api/employees'));
app.use('/users', require('./routes/api/users'));

app.all('*', (req, res) => {
	res.status(404).sendFile(path.join(__dirname, 'views', '404.html'));
})

app.use(errorHandler);

mongoose.connection.once('open', () => {
	console.log('Connected to MongoDB');
	app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

	// https 의존성으로 certificate와 private key로 새로운 서버를 시작
	https.createServer(options, app).listen(8080, () => {
		console.log(`HTTPS server started on port 8080`);
	});
	
});