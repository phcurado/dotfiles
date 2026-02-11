return {
  {
    "nvim-treesitter/nvim-treesitter",
    lazy = false,
    build = ":TSUpdate",
    config = function()
      require("nvim-treesitter").install({
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
      })

      vim.api.nvim_create_autocmd("FileType", {
        pattern = {
          "lua",
          "elixir",
          "heex",
          "json",
          "javascript",
          "typescript",
          "html",
          "css",
          "markdown",
          "bash",
          "dockerfile",
          "gitignore",
          "regex",
          "gdscript",
          "gdshader",
          "terraform",
          "typescriptreact",
          "python",
          "toml",
          "yaml",
          "go",
        },
        callback = function(args)
          if vim.api.nvim_buf_line_count(args.buf) > 50000 then
            return
          end
          vim.treesitter.start()
        end,
      })
    end,
  },
}
