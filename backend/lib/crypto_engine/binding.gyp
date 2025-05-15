{
  "targets": [
    {
      "target_name": "crypto_engine",
      "cflags!": [ "-fno-exceptions" ],
      "cflags_cc!": [ "-fno-exceptions" ],
      "sources": [
        "crypto_engine.cpp",
        "crypto_engine_impl.cpp",
        "node_binding.cpp"
      ],
      "include_dirs": [
        "<!@(node -p \"require('../../../node_modules/node-addon-api').include\")",
        "../../../libs/miracl/include"
      ],
      "defines": [
        "MR_PAIRING_SS2",
        "AES_SECURITY=128",
        "NAPI_CPP_EXCEPTIONS"
      ],
      "dependencies": [
        "<!(node -p \"require('../../../node_modules/node-addon-api').gyp\")"
      ],
      "conditions": [
        ["OS=='win'", {
          "msvs_settings": {
            "VCCLCompilerTool": {
              "ExceptionHandling": 1,
              "AdditionalOptions": [
                "/utf-8",
                "/wd4005",
                "/wd4311",
                "/wd4244",
                "/wd4267"
              ]
            }
          },
          "defines": [
            "_CRT_SECURE_NO_WARNINGS"
          ],
          "libraries": [
            "../../../libs/miracl/lib/miracl.lib"
          ]
        }]
      ]
    }
  ]
}
