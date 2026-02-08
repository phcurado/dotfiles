return {
  {
    "nvim-treesitter/nvim-treesitter",
    build = ":TSUpdate",
    config = function()
      -- disable treesitter for large files
      vim.api.nvim_create_autocmd("BufReadPost", {
        callback = function(args)
          if vim.api.nvim_buf_line_count(args.buf) > 50000 then
            vim.treesitter.stop(args.buf)
          end
        end,
      })

      require("nvim-treesitter").setup({
        ensure_installed = {
          "lua",
          "elixir",
          "heex",
          "json",
          "javascript",
          "typescript",
          "html",
          "css",
          "markdown",
          "markdown_inline",
          "bash",
          "dockerfile",
          "gitignore",
          "regex",
          "gdscript",
          "godot_resource",
          "gdshader",
          "terraform",
          "tsx",
          "python",
          "toml",
          "yaml",
          "go",
        },
        ignore_install = {},
        sync_install = false,
        auto_install = true,
      })
    end,
  },
}
