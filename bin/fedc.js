#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const cwd = process.cwd(); // dir 为全局变量初始为执行目录
const lib = path.join(__dirname, '../lib'); // 保存目录
const utils = path.join(__dirname, '../lib/utils'); // 保存目录
const tpl = path.join(__dirname, '../lib/tpl'); // 保存目录
const color = require('../lib/utils/color'); // 设置颜色 
const pkg = require('../package.json'); // 读取package.json
const childProcess = require('child_process');
const exes = {
    branches: 'webpack -d -w --hide-modules',
    trunk: 'webpack -trunk',
    path: 'webpack -move-path:',
    mpath: 'webpack -d -w --hide-modules -move-path:' // 
};

var dos = exes.branches;

/**
 * 整理入参数
 */
var argvs = process.argv.reduce((o, key, index, arr) => {
    var k = key.replace(/^-/, '').toLowerCase();
    if (/^\[.+\]$/.test(k)) { // 自定义命令
        o['define'] = k.replace(/[\[\]]/g, '');
    } else if (/^\${2}/.test(k)) { // mpath
        o['$$'] = k.replace(/^\${2}/, '');
    } else if (/^\$/.test(k)) {
        o['$'] = k.replace(/^\$/, ''); // path
    } else {
        o[k] = k;
    }
    return o;
}, {});

/** 帮助 */
if (argvs.h) {
    console.log(`${color.TIP} fedc`);
    console.log(`${color.TIP} -h help`);
    console.log(`${color.TIP} -v version`);
    console.log(`${color.TIP} -branches 压缩到branches分支带map文件`);
    console.log(`${color.TIP} 例qyjs branches默认压缩到branches`);
    console.log(`${color.TIP} -trunk 压缩到trunk分支不带map文件`);
    console.log(`${color.TIP} 例qyjs trunk`);
    console.log(`${color.TIP} -$ 压缩到指定路径带map文件`);
    console.log(`${color.TIP} 例qyjs $c:/a/b`);
    console.log(`${color.TIP} $$ 压缩到指定路径不带map文件`);
    console.log(`${color.TIP} 例qyjs $$c:/a/b`);
    console.log(`${color.TIP} [webpack命令]`);
    console.log(`${color.TIP} 例qyjs [webpack-d-w-trunk]方括号内不能有空格`);
    console.log(`${color.TIP}  [webpack-d-w-trunk]方括号内不能有空格`);
    // console.log(`${color.TIP} -reset 备份webpack.config.js,package.json`);
    process.exit();
}

/** 版本号 */
if (argvs.v) {
    console.log(pkg.version);
    process.exit();
}

/** 备份配置文件 */
if (argvs.reset) {
    resetConfigJs();
    return;
}

if (argvs.branches) dos = exes.branches; // 移动到branches分支，生成map文件
if (argvs.trunk) dos = exes.trunk; // 移动到trunk分支，没有map文件
if (argvs.$) dos = exes.path + path.join(argvs.$); // 移动到指定路径
if (argvs.$$) dos = exes.mpath + path.join(argvs.$$); //移动到指定路径并生成map文件
if (argvs.define) {
    dos = getWebpackExe(argvs.define);
}

/** [getWebpackExe 获取webpack命令] */
function getWebpackExe(str) {
    var arr = str.split('-');
    if (arr[0] != 'webpack') {
        return '';
    } else {
        return arr.join(' -');
    }
}

/**
 * [prompt 类似confirm]
 * @param  {[type]}   prompt   [description]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
function prompt(prompt, callback) {
    process.stdout.write(color.INP + prompt);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    process.stdin.once('data', function(chunk) {
        process.stdin.pause();
        callback(chunk.trim());
    });
}

/** [resetConfigJs 备份webpack.config.json文件] */
function resetConfigJs() {
    var t = Date.now();

    if (fs.existsSync(path.join(cwd, 'webpack.config.js'))) {
        fs.rename(path.join(cwd, 'webpack.config.js'), path.join(cwd, t + '_webpack.config.js'));
    }

    if (fs.existsSync(path.join(cwd, 'package.json'))) {
        fs.rename(path.join(cwd, 'package.json'), path.join(cwd, t + '_package.json'));
    }

    copy(path.join(tpl, 'webpack.config.js'), path.join(cwd, 'webpack.config.js'));
    copy(path.join(tpl, 'package.json'), path.join(cwd, 'package.json'));
    console.log(`${color.SUCCESS} 配置文件已重置！`);
}

/** [copy 复制文件到] */
function copy(from, to) {
    var readerStream = fs.createReadStream(from);
    var writerStream = fs.createWriteStream(to);
    readerStream.pipe(writerStream);
}

function isMouduleDir() {
    var webpack = path.join(process.cwd(), 'webpack.config.js');
    var modules = path.join(process.cwd(), 'node_modules');
    var package = path.join(process.cwd(), 'package.json');
    return fs.existsSync(webpack) && fs.existsSync(webpack) && fs.existsSync(webpack);
}

/** [removeWebpackConfigJs 删除webpck.config.js文件] */
function removeWebpackConfigJs() {
    if (!isMouduleDir()) {
        fs.unlink(path.join(cwd, 'webpack.config.js'));
    }
}

/** [addWebpackConfigJs 添加webpck.config.js文件] */
function addWebpackConfigJs() {
    if (!isMouduleDir()) {
        copy(path.join(lib, 'webpack.config.js'), path.join(cwd, 'webpack.config.js'));
    }
}

/** [exeChildProcess 执行子进程] */
function exeChildProcess() {
    if (dos == '') return false;
    const spawn = require('child_process').spawn;
    const ls = spawn(dos + ' --colors', { shell: true });

    ls.stdout.on('data', (data) => {
        console.log(`${data}`);
    });

    ls.stderr.on('data', (data) => {
        console.log(`${data}`);
    });

    ls.on('close', (code) => {
        // console.log(`${code}`);
    });
}

function start() {
    process.on('exit', function(chunk) {
        removeWebpackConfigJs();
    });

    process.on('SIGINT', function(chunk) {
        removeWebpackConfigJs();
        process.exit();
    });
    addWebpackConfigJs();
    exeChildProcess();
}
start();
