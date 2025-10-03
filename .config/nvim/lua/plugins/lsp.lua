return {
  {
    "williamboman/mason.nvim",
    config = function()
      require("mason").setup()
    end,
  },
  {
    "WhoIsSethDaniel/mason-tool-installer.nvim",
    config = function()
      require("mason-tool-installer").setup({
        ensure_installed = {
          "markdownlint",
          "prettierd",
          "shfmt",
          "stylua",
        },
        auto_update = true,
      })
    end,
  },
  {
    "williamboman/mason-lspconfig.nvim",
    dependencies = { "neovim/nvim-lspconfig" },
    config = function()
      require("mason-lspconfig").setup({
        ensure_installed = {
          "lua_ls",
          "elixirls",
          "expert",
          "ts_ls",
          "cssls",
          "tailwindcss",
          "harper_ls",
          "terraformls",
          "denols",
          "bashls",
          "basedpyright",
        },

        automatic_installation = true,
        automatic_enable = {
          exclude = {
            "elixirls",
            "expert",
            "lua_ls",
          },
        },
      })

      -- luals
      vim.lsp.config["luals"] = {
        cmd = { "lua-language-server" },
        filetypes = { "lua" },
        root_markers = { { ".luarc.json", ".luarc.jsonc" }, ".git" },
        settings = {
          Lua = {
            runtime = {
              version = "LuaJIT",
            },
          },
        },
      }

      vim.lsp.enable("gleam")

      -- elixir expert
      vim.lsp.config["expert"] = {
        cmd = { "expert" },
        root_markers = { "mix.exs", ".git" },
        filetypes = { "elixir", "eelixir", "heex" },
      }

      -- global
      vim.lsp.config("*", {
        -- capabilities = capabilities,
        root_markers = { ".git" },
      })

      vim.lsp.enable("luals")
      vim.lsp.enable("expert")
    end,
  },
}
