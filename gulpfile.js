process.env.NODE_ENV = true; //Enabled Production Mode

const gulp = require('gulp');
const csso = require('gulp-csso');
const htmlmin = require('gulp-htmlmin');
const minify = require('gulp-minify');

gulp.task('build', [ 'html', 'css', 'js', 'assets' ]);

gulp.task('html', () => {
  return gulp.src(['./html/*.html'])
    .pipe(htmlmin({
      collapseWhitespace: true,
      removeComments: true
    }))
    .pipe(gulp.dest('./dist/'));
});

gulp.task('css', () => { // Minify the Css
  return gulp.src('./html/static/*.css')
    .pipe(csso())
    .pipe(gulp.dest('./dist/static/'))
});

gulp.task('js', () => { // Minify the Javascript
  return gulp.src("./html/static/*.js")
    .pipe(minify({
            ext:{
                min:'.js'
            },
            noSource: true
          }))
    .pipe(gulp.dest('./dist/static/'));
});

gulp.task('assets', () => {
  return gulp.src('./html/*.ico')
      .pipe(gulp.dest('./dist/'));
});
