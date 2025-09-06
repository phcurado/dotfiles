return {
  "folke/snacks.nvim",
  priority = 1000,
  lazy = false,
  opts = {
    bigfile = { enabled = true },
    explorer = {
      layout = { preset = "sidebar", preview = false },
    },
    dashboard = {
      sections = {
        -- { section = "terminal", cmd = "fortune -s | cowsay", hl = "header", padding = 1, indent = 8 },
        { section = "header" },
        { section = "keys", gap = 1, padding = 1 },
        {
          pane = 2,
          icon = " ",
          title = "Recent Files",
          section = "recent_files",
          indent = 2,
          padding = 1,
        },
        { pane = 2, icon = " ", title = "Projects", section = "projects", indent = 2, padding = 1 },
        {
          pane = 2,
          icon = " ",
          title = "Git Status",
          section = "terminal",
          enabled = function()
            return Snacks.git.get_root() ~= nil
          end,
          cmd = "git status --short --branch --renames",
          height = 5,
          padding = 1,
          ttl = 5 * 60,
          indent = 3,
        },
        { section = "startup" },
      },
    },
    indent = { enabled = false },
    input = { enabled = true },
    notifier = {
      enabled = true,
      timeout = 4000,
    },
    quickfile = { enabled = true },
    -- Disabling scroll since it have some bugs
    scroll = { enabled = false },
    statuscolumn = { enabled = true },
    words = { enabled = true },
    picker = {
      ui_select = true,
    },
  },
  keys = {
    {
      "<leader>bd",
      function()
        Snacks.bufdelete()
      end,
      desc = "Delete the current buffer",
    },
    {
      "<leader>bD",
      function()
        Snacks.bufdelete.other()
      end,
      desc = "Delete all buffers except the current one",
    },
    {
      "<leader>gB",
      function()
        Snacks.gitbrowse()
      end,
      desc = "Git Browse",
      mode = { "n", "v" },
    },
    {
      "<leader>n",
      function()
        Snacks.picker.explorer()
      end,
      desc = "Toggle tree explorer",
    },
    {
      "<leader>ff",
      function()
        Snacks.picker.files({
          finder = "files",
          format = "file",
          show_empty = true,
          hidden = true,
          ignored = false,
          follow = false,
          supports_live = true,
          layout = {
            preset = "ivy",
            layout = { position = "bottom", backdrop = 70 },
          },
        })
      end,
      desc = "Find files",
    },
    {
      "<leader>fg",
      function()
        Snacks.picker.grep({
          finder = "grep",
          regex = true,
          format = "file",
          show_empty = true,
          live = true, -- live grep by default
          supports_live = true,
          hidden = true,
          layout = {
            preset = "ivy",
            layout = { position = "bottom", backdrop = 70 },
          },
        })
      end,
      desc = "Live Grep",
    },
    {
      "<leader>fb",
      function()
        Snacks.picker.buffers({
          layout = {
            preset = "ivy",
            layout = { position = "bottom", backdrop = 70 },
          },
        })
      end,
      desc = "Search buffers",
    },
    {
      "<leader>fr",
      function()
        Snacks.picker.resume()
      end,
      desc = "Resume",
    },
    {
      "<leader>/",
      function()
        Snacks.picker.lines()
      end,
      desc = "Search lines",
    },
    {
      "<leader>N",
      desc = "Neovim News",
      function()
        Snacks.win({
          file = vim.api.nvim_get_runtime_file("doc/news.txt", false)[1],
          width = 0.6,
          height = 0.6,
          wo = {
            spell = false,
            wrap = false,
            signcolumn = "yes",
            statuscolumn = " ",
            conceallevel = 3,
          },
        })
      end,
    },
  },
  init = function()
    vim.api.nvim_create_autocmd("User", {
      pattern = "VeryLazy",
      callback = function()
        Snacks.toggle.option("relativenumber", { name = "Relative Number" }):map("<leader>rN")
        Snacks.toggle
          .option("conceallevel", { off = 0, on = vim.o.conceallevel > 0 and vim.o.conceallevel or 2 })
          :map("<leader>cr")
      end,

      vim.api.nvim_create_user_command("SnacksColorScheme", function(args)
        vim.cmd(":lua Snacks.picker.colorschemes()")
      end, {
        desc = "List colorschemes",
      }),
    })
  end,
}
