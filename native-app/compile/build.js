const { compile } = require('nexe')

compile({
    input: 'C:\\Users\\username\\IdeaProjects\\youtube-scrobbler\\native-app\\app.js',
    build: true,
    verbose: true
}).then(() => {
    console.log('success')
})