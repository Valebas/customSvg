'use strict';
const autoprefixer = require('autoprefixer');
const concat = require('gulp-concat');
const csscomb = require('gulp-csscomb');
const del = require('del');
const gulp = require('gulp');
const imagemin = require('gulp-imagemin');
const jpg = require('imagemin-jpeg-recompress');
const minify = require('gulp-csso');
const mqpacker = require('css-mqpacker');
const notify = require('gulp-notify');
const plumber = require('gulp-plumber');
const png = require ('imagemin-pngquant');
const postcss = require('gulp-postcss');
const rename = require('gulp-rename');
const sass = require('gulp-sass');
const sassGlob = require('gulp-sass-glob');
const serve = require('browser-sync').create();
const svgstore = require("gulp-svgstore");
const svgmin = require("gulp-svgmin");
const uglify = require('gulp-uglify');

function server(done) {
  serve.init({
    server: './app',
    // Если нужно взаимодействие с OSPanel
    // раскомментировать proxy и удалить строчку выше с server
    // proxy: 'current/app',
    // current ибо это название папки, которое по идеи должно оставаться в OSPanel, но если нет проблема скорее-всего в этом
    notify: false,
    open: "local",
    port: 5555
  });
  done();
}

function serverReload(done) {
  serve.reload();
  done();
}

function comb() {
  return gulp.src('app/scss/blocks/*.scss')
  .pipe(plumber())
  .pipe(csscomb())
  .pipe(gulp.dest('app/scss/blocks'))
}

function css() {
  return gulp.src('app/scss/style.scss')
  .pipe(plumber())
  .pipe(sassGlob())
  .pipe(sass({
    includePaths: require('node-normalize-scss').includePaths,
    outputStyle: 'expanded'
  })).on("error", notify.onError())
  .pipe(postcss([
    autoprefixer({ overrideBrowserslist: [
      'last 2 versions'
    ], grid: true }),
    mqpacker({
      sort: true
    })
  ]))
  .pipe(gulp.dest('app/css'))
  .pipe(minify())
  .pipe(rename('style.min.css'))
  .pipe(gulp.dest('app/css'))
  .pipe(serve.stream());
}

function common() {
  return gulp
  .src('app/js/common.js')
  .pipe(plumber())
  .pipe(concat('common.min.js'))
  .pipe(uglify()).on('error', notify.onError())
  .pipe(gulp.dest('app/js'));
}

function js() {
	return gulp
  .src([
    'app/libs/jquery/jquery.min.js',
    'app/libs/fotorama/fotorama.js',
    'app/libs/magnific-popup/jquery.magnific-popup.min.js',
    'app/libs/owl.carousel/owl.carousel.min.js',
    'app/libs/selectize/selectize.min.js',
		'app/js/common.min.js',
		])
	.pipe(concat('script.min.js'))
  .pipe(uglify())
	.pipe(gulp.dest('app/js'))
  .pipe(serve.stream());
}

function watchFiles() {
  gulp.watch('app/scss/**/*.scss', css);
  gulp.watch('app/*.html', serverReload);
  gulp.watch('app/**/*.php', serverReload);
  gulp.watch('app/js/common.js', gulp.series(common, js))
}

function clean() {
  return del('dist');
}

function buildCss() {
  return gulp.src([
    'app/css/style.min.css',
  ])
  .pipe(gulp.dest('dist/css'));
}

function buildImages() {
  return gulp.src('app/img/**/*')
    .pipe(imagemin([
      imagemin.gifsicle({
        interlaced: true,
        optimizationLevel: 3
      }),
      imagemin.svgo({
        plugins: [
          {removeViewBox: false},
          {cleanupIDs: false}
        ]
      }),
      jpg({
        accurate: true,
        // выше medium идти бессмысленно
        quality: 'low',
        progressive: true,
        strip: true
      }),
      png({
        accurate: true,
        quality: [0.7, 0.9],
        strip: true
      }),
    ]))
    .pipe(gulp.dest('dist/img'));
}

function buildSvg() {
  return gulp.src('app/img/icons/*.svg')
  .pipe(svgmin())
  .pipe(svgstore({
    inlineSvg: true
  }))
  .pipe(rename('symbols.svg'))
  .pipe(gulp.dest('dist/img'));
}

function buildHtml() {
  return gulp.src([
    'app/*.html',
  ])
  .pipe(gulp.dest('dist'));
}

function buildJs() {
  return gulp.src([
    'app/js/script.min.js',
  ])
  .pipe(gulp.dest('dist/js'));
}

function buildFonts() {
  return gulp.src([
    'app/fonts/**/*.{ttf,woff,woff2}',
  ])
  .pipe(gulp.dest('dist/fonts'));
}

gulp.task('clean', clean);
gulp.task('common', common);
gulp.task('js', js);
gulp.task('comb', comb);

gulp.task('build',
  gulp.series('clean', 'common', 'js',
    gulp.parallel(buildCss, buildImages, buildSvg, buildHtml, buildJs, buildFonts)
  )
);

gulp.task('watch',
  gulp.parallel(watchFiles, server)
);

gulp.task('default',
  gulp.series('comb', 'watch')
);
