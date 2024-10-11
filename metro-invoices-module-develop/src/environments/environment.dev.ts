
export const environment = {
  production: false,
  invoicesApi : 'https://orion-dev.atcmultimidia.com.br/invoices/api/v1/',
  backendSecurityCallback: 'https://orion-dev.atcmultimidia.com.br/invoices/login/cas',
  backendSecurityLogout: 'https://orion-dev.atcmultimidia.com.br/invoices/logout/cas',
  profileLoaderUrl: 'https://orion-dev.atcmultimidia.com.br/invoices/profile',
  loginRedirectUrl: 'https://orion-dev.atcmultimidia.com.br/orion-cas/login?service=https://orion-dev.atcmultimidia.com.br/invoices/login/cas',
  logoutRedirectUrl:'https://orion-dev.atcmultimidia.com.br/orion-cas/logout?service=https://orion-dev.atcmultimidia.com.br/orion',
  localLogoutApi : 'https://orion-dev.atcmultimidia.com.br/invoices/logout',
  homeUrl : 'https://orion-dev.atcmultimidia.com.br/orion',
  casResendPassUrl : 'https://orion-dev.atcmultimidia.com.br/orion-cas/recuperar',
  applicationContext : '/sicop/',
  version: '3.2.0',
  dateVersion: 'dev 06/06/2024'
};
