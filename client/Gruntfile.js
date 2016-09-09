module.exports = function( grunt ){
  grunt.initConfig({
    pkg: grunt.file.readJSON( 'package.json' ),
    browserify: {
      dist: {
        options: {
           transform: [['babelify', {presets: ['es2015']}]]
        },
        src: ['./cms.js'],
        dest: '../files/js/cms.js'
      }
    },
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
      },
      build: {
        src: '../files/js/cms.js',
        dest: '../files/js/cms.min.js'
      }
    }
  })

  grunt.loadNpmTasks( 'grunt-browserify' )
  grunt.loadNpmTasks( 'grunt-contrib-uglify' )
  grunt.registerTask( 'default', [ 'browserify', 'uglify' ] )
}
