const axios = require('axios');
axios.get('http://127.0.0.1:8000/api/platforms?page=1').then(res => console.log(JSON.stringify(res.data['hydra:member'][0], null, 2))).catch(e => console.error(e.message));
