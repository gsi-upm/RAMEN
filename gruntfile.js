module.exports = function (grunt) {

  require("matchdep").filterAll("grunt-*").forEach(grunt.loadNpmTasks);

  var globalConfig = {
    moduleName: "ramen",
    sources: ["src/*.ts", "src/*/*.ts"],
    outDir: "dist",
    docDir: "doc",
    exampleDir: "executable/js/"
  };

  var configuration = {
    clean: [globalConfig.outDir, globalConfig.docDir]
  };

  configuration.copy = {};
  configuration.copy[globalConfig.moduleName] = {
    src: globalConfig.outDir + "/" + globalConfig.moduleName + ".js",
    dest: globalConfig.exampleDir + "/" + globalConfig.moduleName + ".js"
  };

  // configuration.copy.threejs = {
  //   src: "node_modules/three/three.min.js",
  //   dest: globalConfig.exampleDir + "/three.min.js"
  // }

  configuration.typescript = {
    options: {
      target: "es5",
      declaration: true,
      sourceMap: true,
      removeComments: false
    }
  };
  configuration.typescript[globalConfig.moduleName] = {
    src: globalConfig.sources,
    dest: globalConfig.outDir + "/" + globalConfig.moduleName + ".js"
  };

  configuration.typedoc = {
    options: {
      name: globalConfig.moduleName,
      target: "es5",
      mode: "file",
      readme: "none"
    }
  }
  configuration.typedoc[globalConfig.moduleName] = {
    options: {
      out: globalConfig.docDir + "/" + globalConfig.moduleName,
      name: globalConfig.moduleName
    },
    src: globalConfig.sources
  };

  configuration.uglify = {
    options: {
      mangle: true,
      beautify: false,
      sourceMap: true
    }
  }
  configuration.uglify[globalConfig.moduleName] = {
    files: {}
  }
  configuration.uglify[globalConfig.moduleName].files["dist/" + globalConfig.moduleName + ".min.js"] = globalConfig.outDir + "/" + globalConfig.moduleName +".js";

  grunt.initConfig(configuration);

  grunt.registerTask("debug", [
    "typescript:" + globalConfig.moduleName
  ]);

  grunt.registerTask("executable", [
    // "copy:threejs",
    "copy:" + globalConfig.moduleName
  ]);

  grunt.registerTask("release", [
    "clean",
    "debug",
    "uglify:" + globalConfig.moduleName,
    "typedoc:" + globalConfig.moduleName
  ]);

  grunt.registerTask("default", [
    "debug",
    "executable"
  ]);
};
