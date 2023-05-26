const app = require('./server.js')


app.listen(process.env.PORT || 8000, () => {
  console.log('listening on http://localhost:8000');
});