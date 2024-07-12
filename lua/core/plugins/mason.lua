require('mason').setup()
require("mason-lspconfig").setup({
  ensure_installed = {"lua_ls", "elixirls"}
})

require("mason-lspconfig").setup_handlers {
  function (server_name)
    require("lspconfig")[server_name].setup {}
  end,
  ["elixirls"] = function ()
    -- do nothing since elixir-tools will handle the configuration
  end
}

local lspconfig = require("lspconfig")
local capabilities = require("cmp_nvim_lsp").default_capabilities()
lspconfig.elixirls.setup({
  cmd = { "elixir-ls" },
  -- set default capabilities for cmp lsp completion source
  capabilities = capabilities,
})
