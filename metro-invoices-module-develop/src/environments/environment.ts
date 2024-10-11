
export const environment = {
  production: false,

  invoicesApi : 'api/v1/',
  backendSecurityCallback: 'login/cas',
  backendSecurityLogout: 'logout/cas',
  profileLoaderUrl: 'profile',
  loginRedirectUrl: 'https://orionhost:9243/orion-cas/login?service=http://orionhost:8090/login/cas',
  logoutRedirectUrl:'https://orionhost:9243/orion-cas/logout?service=https://orionhost:9243/orion',
  localLogoutApi : 'logout',
  homeUrl : 'https://orionhost:9243/orion',
  casResendPassUrl : 'change-password',
  applicationContext : '/',
  version: '3.2.0',
  dateVersion: '06/06/2024'
  };
