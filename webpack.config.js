const VueLoaderPlugin = require("vue-loader/lib/plugin")
const path = require("path")
const fs = require("fs")
const handlebars = require("handlebars")
const chalk = require("chalk")
const CopyWebpackPlugin = require("copy-webpack-plugin")
const CompressionWebpackPlugin = require("compression-webpack-plugin")
const webpack = require("webpack")
const webpackConfigFilter = require("webpack-config-filter")

const mode = "development"
// const mode = "production"
const distPath = path.join(__dirname, "./dist")
const genPath = path.join(__dirname, "gen")
const development = mode === "development"
const production = mode === "production"

const webpackConfig = {
    mode: mode,
    entry: {
        //entry通过扫描pages下的目录自动生成
    },
    output: {
        path: distPath,
        filename: "[name].js"
    },
    module: {
        rules: [
            {
                test: /\.vue$/,
                loader: "vue-loader"
            },
            {
                test: /\.worker\.js$/, //以.worker.js结尾的文件将被worker-loader加载
                use: {loader: 'worker-loader'}
            },
            {
                test: /\.css$/,
                use: ["vue-style-loader", "css-loader"]
            },
            {
                test: /\.less$/,
                use: ["vue-style-loader", "css-loader", "less-loader"]
            },
            {
                test: /\.ts$/,
                use: ['ts-loader']
            },
            {
                test: /\.(png|jpg|gif|mp3|svg|ttf|woff|eot|woff2)$/,
                loader: "url-loader",
                options: {
                    name: "[name].[ext]?[hash]",
                    limit: 8192
                }
            }
        ]
    },
    resolve: {
        extensions: [".ts", ".js", ".vue"],
        alias: {
            vue: "vue/dist/vue.js"
        }
    },
    plugins: [
        new VueLoaderPlugin(),
        new webpack.HotModuleReplacementPlugin(),
        new CopyWebpackPlugin([
            {
                from: path.join(__dirname, "./public")
            }, {
                from: path.join(__dirname, './res'),
                to: 'res'
            }
        ]),
        {
            condition: production,
            ifTrue: new CompressionWebpackPlugin({
                test: new RegExp("\\.(" + ["js", "css"].join("|") + ")$"),
                // asset: "[path].gz[hash]",
                algorithm: "gzip",
                threshold: 10240,
                minRatio: 0.8
            })
        }
    ],
    devServer: {
        contentBase: distPath,
        proxy: {
            "/api": "http://localhost:8080"
        },
        host: "0.0.0.0",
        port: 8000,
        hot: true,
        disableHostCheck: true,
        historyApiFallback: {
            rewrites: [{from: /^\/$/, to: "/Index.html"}]
        }
    },
    externals: {
        condition: production,
        ifTrue: {
            vue: "Vue",
            "element-ui": "ELEMENT",
            "vue-router": "VueRouter"
        },
        ifFalse: {}
    }
}

//handlebars编译，根据templatePath指定的模板位置，结合context生成到distPath目录下
function handlebarsCompile(templatePath, distPath, context) {
    const template = handlebars.compile(fs.readFileSync(templatePath).toString("utf8"))
    const s = template(context)
    fs.writeFileSync(distPath, s)
    console.log(chalk.green(`compile from ${templatePath} to ${distPath} succssfully`))
}

//为每个Vue生成html文件
function generatePages() {
    //如果dist和gen不存在，创建之
    for (var p of [distPath, genPath]) {
        if (!fs.existsSync(p)) {
            fs.mkdirSync(p)
        }
    }

    for (var file of fs.readdirSync("./pages")) {
        if (!file.endsWith(".vue")) continue
        const filename = file.slice(0, file.length - ".vue".length)
        const jsPath = path.join(genPath, `${filename}.js`)
        const htmlPath = path.join(distPath, `${filename}.html`)
        handlebarsCompile("index.html", htmlPath, {
            production: webpackConfig.mode === "production",
            main: `${filename}.js`
        })
        handlebarsCompile("main.js", jsPath, {
            component: file
        })
        webpackConfig.entry[filename] = [
            "./" + path.relative(__dirname, jsPath),
            {
                condition: development,
                ifTrue: "element-ui/lib/theme-chalk/index.css"
            }, {
                condition: development,
                ifTrue: "font-awesome/css/font-awesome.min.css"
            }
        ]
    }
}

generatePages();
module.exports = webpackConfigFilter(webpackConfig);
