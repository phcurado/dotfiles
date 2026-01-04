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
          "prettier",
          "prettierd",
          "shfmt",
          "stylua",
          "black",
          "tflint",
          "templ",
          "pgformatter",
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
          -- "expert",
          "ts_ls",
          "cssls",
          "tailwindcss",
          "harper_ls",
          "terraformls",
          "denols",
          "bashls",
          "basedpyright",
          "gopls",
          "helm_ls",
          "postgres_lsp",
        },

        automatic_installation = true,
        automatic_enable = {
          exclude = {
            "elixirls",
            -- "expert",
            "lua_ls",
          },
        },
      })

      -- luals
      vim.lsp.config["lua_ls"] = {
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

      -- elixir
      vim.lsp.config["elixirls"] = {
        cmd = { "elixir-ls" },
        root_markers = { "mix.exs", ".git" },
        filetypes = { "elixir", "eelixir", "heex" },
      }

      -- golang
      vim.lsp.config["gopls"] = {}

      -- global
      vim.lsp.config("*", {
        -- capabilities = capabilities,
        root_markers = { ".git" },
      })

      vim.lsp.enable("lua_ls")
      vim.lsp.enable("elixirls")
      vim.lsp.enable("gopls")
      vim.lsp.enable("helm_ls")
      vim.lsp.enable("postgres-language-server")
    end,
  },
}
