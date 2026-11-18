// Configuração do Babel usada pelo babel-jest para transformar os
// módulos ES (import/export) do projeto em algo que o Jest consegue executar.
module.exports = {
    presets: [['@babel/preset-env', { targets: { node: 'current' } }]],
};
