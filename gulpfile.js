import gulp from "gulp";
import browser from "browser-sync";
import plumber from "gulp-plumber";
import data from "./source/templates/_data.js";
import twig from "gulp-twig";
import htmlmin from "gulp-htmlmin";
import { htmlValidator } from "gulp-w3c-html-validator";
import bemlinter from "gulp-html-bemlinter";
import dartSass from "sass";
import gulpSass from "gulp-sass";
import { stacksvg } from "gulp-stacksvg";
import postcss from "gulp-postcss";
import postUrl from "postcss-url";
import autoprefixer from "autoprefixer";
import csso from "postcss-csso";
import terser from "gulp-terser";
import squoosh from "gulp-libsquoosh";
import { deleteAsync } from "del";
import gulpIf from "gulp-if";

const { src, dest, watch, series, parallel } = gulp;
const sass = gulpSass(dartSass);

data.isDevelopment = true;

export function processMarkup() {
	return src("./source/*.html")
		.pipe(twig({
			data: data
		}))
		.pipe(htmlmin({ collapseWhitespace: !data.isDevelopment }))
		.pipe(dest("./build"))
		.pipe(gulpIf(data.isLinting, htmlValidator.analyzer()))
		.pipe(gulpIf(data.isLinting, htmlValidator.reporter({ throwErrors: true })))
		.pipe(gulpIf(data.isLinting, bemlinter()));
}

export function validateMarkup(done) {
	data.isLinting = true;
	series(processMarkup)(done);
}

export function processStyles() {
	const sassOptions = {
		functions: {
			"getbreakpoint($bp)": (bp) => new dartSass.types.Number(data.viewports[bp.getValue()]),
			"getext($name)": (name) => new dartSass.types.String(data.images[name.getValue()].ext),
			"getmaxdppx($name)": (name) => new dartSass.types.Number(data.images[name.getValue()].maxdppx),
			"getviewports($name)": function (name) {
				let [...vps] = data.images[name.getValue()].viewports;
				let viewports = new dartSass.types.List(vps.length);
				vps.reverse().forEach((vp, i) => { viewports.setValue(i, new dartSass.types.String(vp)) });
				return viewports;
			}
		}
	}

	return src("./source/sass/*.scss", { sourcemaps: data.isDevelopment })
		.pipe(plumber())
		.pipe(sass(sassOptions).on("error", sass.logError))
		.pipe(postcss([
			postUrl({ assetsPath: "../" }),
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

export function createStack() {
	return src("./source/icons/**/*.svg")
		.pipe(stacksvg())
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
	watch("./source/icons/**/*.svg", series(createStack, reloadServer));
}

export function compileProject(done) {
	parallel(
		processStyles,
		processMarkup,
		processScripts,
		createStack,
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

export function runDev (done) {
	series(
		removeBuild,
		compileProject,
		startServer,
		watchFiles
	)(done);
}
