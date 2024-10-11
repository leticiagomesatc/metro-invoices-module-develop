const proxy = [
    {
      context: '/api',
      target: 'http://localhost:8090',
      pathRewrite: {'^/api' : '/api'}
    },
    {
      context: '/profile',
      target: 'http://localhost:8090',
      pathRewrite: {'^/profile' : '/profile'}
    },
    {
      context: '/change-password',
      target: 'https://orionhost:9243/orion-cas/recuperar',
      secure : false
    },
    {
      context: '/logout',
      target: 'http://localhost:8090' ,
      pathRewrite: {'^/logout' : '/logout'}
    }
  ];
  module.exports = proxy;