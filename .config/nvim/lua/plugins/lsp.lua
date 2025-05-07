return {
  {
    "williamboman/mason.nvim",
    config = function()
      require("mason").setup()
    end,
  },
  {
    "williamboman/mason-lspconfig.nvim",
    dependencies = { "neovim/nvim-lspconfig" },
    config = function()
      local capabilities = require("blink.cmp").get_lsp_capabilities()
      local lspconfig = require("lspconfig")

      require("mason-lspconfig").setup({
        ensure_installed = {
          "lua_ls",
          "elixirls",
          "ts_ls",
          "cssls",
          "tailwindcss",
        },
        automatic_installation = true,
      })

      -- elixirls
      lspconfig.elixirls.setup({
        cmd = {
          vim.fn.stdpath("data") .. "/mason/packages/elixir-ls/language_server.sh",
        },
        capabilities = capabilities,
        settings = {
          elixirLS = {
            dialyzerEnabled = false,
            fetchDeps = false,
          },
        },
      })

      -- lua_ls
      lspconfig.lua_ls.setup({
        capabilities = capabilities,
        on_init = function(client)
          local path = client.workspace_folders and client.workspace_folders[1].name
          if
            path
            and path ~= vim.fn.stdpath("config")
            and (vim.loop.fs_stat(path .. "/.luarc.json") or vim.loop.fs_stat(path .. "/.luarc.jsonc"))
          then
            return
          end
          client.config.settings.Lua = vim.tbl_deep_extend("force", client.config.settings.Lua, {
            runtime = { version = "LuaJIT" },
            workspace = {
              checkThirdParty = false,
              library = { vim.env.VIMRUNTIME },
            },
          })
        end,
        settings = {
          Lua = {},
        },
      })

      -- tailwindcss
      lspconfig.tailwindcss.setup({
        capabilities = capabilities,
        init_options = {
          userLanguages = {
            elixir = "html-eex",
            eelixir = "html-eex",
            heex = "html-eex",
          },
        },
      })

      -- others
      lspconfig.ts_ls.setup({
        capabilities = capabilities,
      })

      lspconfig.cssls.setup({
        capabilities = capabilities,
      })
    end,
  },
}
