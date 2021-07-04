module.exports = {
  transpileDependencies: [
    'vuetify'
  ],

  lintOnSave: false,
  publicPath: process.env.NODE_ENV === 'production'
    ? '/us_crime_rate_map/'
    : '/'
}
