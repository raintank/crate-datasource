module.exports = function(grunt) {

  require('load-grunt-tasks')(grunt);

  grunt.loadNpmTasks('grunt-execute');
  grunt.loadNpmTasks('grunt-contrib-clean');

  grunt.initConfig({

    clean: ["dist"],

    copy: {
      src_to_dist: {
        cwd: 'src',
        expand: true,
        src: ['**/*', '!**/*.js', '!**/*.scss'],
        dest: 'dist'
      },
      pluginDef: {
        expand: true,
        src: ['plugin.json', 'README.md'],
        dest: 'dist'
      }
    },

    watch: {
      rebuild_all: {
        files: ['src/**/*', 'plugin.json'],
        tasks: ['default'],
        options: {spawn: false}
      }
    },

    typescript: {
      build: {
        src: ['src/**/*.ts', "!src/spec/**/*", "!**/*.d.ts"],
        dest: 'dist/',
        options: {
          module: 'system', //or commonjs
          target: 'es3', //or es5
          rootDir: 'src/',
          sourceRoot: 'src/',
          declaration: true,
          emitDecoratorMetadata: true,
          experimentalDecorators: true,
          sourceMap: true,
          noImplicitAny: false,
        }
      },
      distTests: {
        src: ['src/**/*.ts', "!src/spec/**/*", "!**/*.d.ts"],
        dest: 'dist/test/',
        options: {
          module: 'commonjs', //or commonjs
          target: 'es5', //or es5
          rootDir: 'src/',
          sourceRoot: 'src/',
          declaration: true,
          emitDecoratorMetadata: true,
          experimentalDecorators: true,
          sourceMap: true,
          noImplicitAny: false,
        }
      },
      // distTestsSpecs: {
      //   src: ['src/spec/**/*.ts'],
      //   dest: 'dist/test/',
      //   options: {
      //     module: 'commonjs', //or commonjs
      //     target: 'es5', //or es5
      //     declaration: true,
      //     emitDecoratorMetadata: true,
      //     experimentalDecorators: true,
      //     sourceMap: true,
      //     noImplicitAny: false,
      //   }
      // }
    },

    babel: {
      options: {
        sourceMap: true,
        presets:  ['es2015']
      },
      distTestsSpecsNoSystemJs: {
        files: [{
          expand: true,
          cwd: 'src/spec',
          src: ['**/*.js'],
          dest: 'dist/test/spec',
          ext:'.js'
        }]
      }
    },

    mochaTest: {
      test: {
        options: {
          reporter: 'spec'
        },
        src: ['dist/test/spec/test-main.js', 'dist/test/spec/*_specs.js']
      }
    }
  });

  grunt.registerTask('default', [
    'clean',
    'copy:src_to_dist',
    'copy:pluginDef',
    'typescript:build',
    'typescript:distTests',
    'babel:distTestsSpecsNoSystemJs',
    'mochaTest'
  ]);
};
