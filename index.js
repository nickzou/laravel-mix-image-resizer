const mix = require('laravel-mix')
const fs = require('fs-extra')
const path = require('path')
const glob = require('glob')
const sharp = require('sharp')
const imageSize = require('image-size')
const imagemin = require('imagemin')
const imageminMozjpeg = require('imagemin-mozjpeg')
const imageminPngquant = require('imagemin-pngquant')
const imageminWebp = require('imagemin-webp')

const defaultOptions = {
    disable: false,
    from: 'resources',
    to: 'public',
    sizes: [
        414,
        768,
        828,
        1024,
        1280,
        1536,
        1600
    ],
    webp: true,
    imageminMozjpegOptions: {
        quality: 80
    },
    imageminPngquantOptions: {
        quality: [0.3, 0.5]
    },
    imageminWebpOptions: {
        quality: 50
    },
}

class ImageResizer {
    register(extraOptions = {}) {
        const {
            disable,
            sizes,
            from,
            to,
            webp,
            imageminMozjpegOptions,
            imageminPngquantOptions,
            imageminWebpOptions,
        } = Object.assign(defaultOptions, extraOptions)

        if (disable) return

        sizes.sort((a, b) => {
            if (a > b) {
                return 1
            } else {
                return -1
            }
        })
        fs.copySync(from, to)
        const images = glob.sync(to + '/**/*').forEach((imagePath) => {
            if (imagePath.match(/\.(jpe?g|png|gif)$/i) === null || imagePath.match('resized')) {
                return
            }

            let {root, dir, base, ext, name} = path.parse(imagePath)

            imagemin([imagePath, dir + '/' + name + '-resized-*'], {
                destination: dir,
                plugins: [
                    imageminMozjpeg(imageminMozjpegOptions),
                    imageminPngquant(imageminPngquantOptions),
                ],
            })

            if (webp) {
                imagemin([imagePath, dir + '/' + name + '-resized-*'], {
                    destination: dir,
                    plugins: [
                        imageminWebp(imageminWebpOptions)
                    ],
                })
            }

            let width = imageSize(imagePath).width
            sizes.forEach((w) => {
                if (width < w) {
                    return
                }
                sharp(imagePath)
                    .resize(w)
                    .toFile(dir + '/' + name + '-resized-' + w + ext)
            })
        })
    }
}

mix.extend('ImageResizer', new ImageResizer())
