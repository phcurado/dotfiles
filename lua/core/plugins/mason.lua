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
