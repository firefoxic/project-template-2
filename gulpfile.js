import gulp from "gulp";
import browser from "browser-sync";
import plumber from "gulp-plumber";
import data from "./source/templates/_data.js";
import twig from "gulp-twig";
import htmlmin from "gulp-htmlmin";
import { htmlValidator } from "gulp-w3c-html-validator";
import sass from "gulp-dart-sass";
import svgSprite from "gulp-svg-sprite";
import postcss from "gulp-postcss";
import postUrl from "postcss-url";
import postImport from "postcss-import";
import postScss from "postcss-scss";
import postCustomMedia from "postcss-custom-media";
import autoprefixer from "autoprefixer";
import csso from "postcss-csso";
import terser from "gulp-terser";
import squoosh from "gulp-libsquoosh";
import { deleteAsync } from "del";
import gulpIf from "gulp-if";

const { src, dest, watch, series, parallel } = gulp;
data.isDevelopment = true;

export function processMarkup() {
	return src("./source/*.html")
		.pipe(twig({
			data: data
		}))
		.pipe(htmlmin({ collapseWhitespace: !data.isDevelopment }))
		.pipe(dest("./build"))
		.pipe(gulpIf(data.isLinting, htmlValidator.analyzer()))
		.pipe(gulpIf(data.isLinting, htmlValidator.reporter({ throwErrors: true })));
}

export function validateMarkup(done) {
	data.isLinting = true;
	series(processMarkup)(done);
}

export function processStyles() {
	return src("./source/sass/*.scss", { sourcemaps: data.isDevelopment })
		.pipe(plumber())
		.pipe(postcss([
			postImport(),
			postUrl(),
			postCustomMedia()
		], { syntax: postScss }))
		.pipe(sass().on("error", sass.logError))
		.pipe(postcss([
			autoprefixer(),
			csso()
		]))
		.pipe(dest("./build/css", { sourcemaps: data.isDevelopment }))
		.pipe(browser.stream());
}

export function processScripts() {
	return src("./source/js/*.js")
		.pipe(terser())
		.pipe(dest("./build/js"))
		.pipe(browser.stream());
}

export function optimizeImages() {
	return src("./source/img/**/*.{png,jpg}")
		.pipe(gulpIf(!data.isDevelopment, squoosh()))
		.pipe(dest("build/img"))
}

export function copyImages() {
	return src("./source/img/**/*.{png,jpg}")
		.pipe(dest("build/img"))
}

export function createWebp(done) {
	if (!data.isDevelopment) {
		return src("./source/img/**/*.{jpg,png}")
			.pipe(squoosh({ webp: {} }))
			.pipe(dest("./build/img"))
	} else {
		done()
	}
}

export function createAvif(done) {
	if (!data.isDevelopment) {
		return src("./source/img/**/*.{jpg,png}")
			.pipe(squoosh({ avif: {} }))
			.pipe(dest("./build/img"))
	} else {
		done()
	}
}

export function createSprite() {
	return src("./source/icons/*.svg")
		.pipe(svgSprite({
			mode: {
				stack: {
					sprite: "../sprite.svg"
				}
			},
		}))
		.pipe(dest("./build/icons"));
}

export function copyAssets() {
	return src([
		"./source/fonts/*.{woff2,woff}",
		"./source/*.ico",
		"./source/img/**/*.svg",
		"./source/favicons/*",
		"./source/*.webmanifest"
	], {
		base: "./source"
	})
		.pipe(dest("./build"))
}

export function removeBuild() {
	return deleteAsync("./build");
};

export function startServer(done) {
	browser.init({
		server: {
			baseDir: "./build"
		},
		cors: true,
		notify: false,
		ui: false,
	});
	done();
}

function reloadServer(done) {
	browser.reload();
	done();
}

function watchFiles() {
	watch("./source/sass/**/*.scss", series(processStyles));
	watch("./source/js/*.js", series(processScripts, reloadServer));
	watch(["./source/**/*.{html,twig}", "./source/**/_data.js"], series(processMarkup, reloadServer));
	watch("./source/icons/**/*.svg", series(createSprite, reloadServer));
}

export function compileProject(done) {
	parallel(
		processStyles,
		processMarkup,
		processScripts,
		createSprite,
		copyAssets,
		optimizeImages,
		createWebp,
		createAvif
	)(done);
}

// Production

export function build(done) {
	data.isDevelopment = false;
	series(
		removeBuild,
		compileProject
	)(done);
}

// Development

export default series(
	removeBuild,
	compileProject,
	startServer,
	watchFiles
);
