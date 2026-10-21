-- Ctrl-h/j/k/l moves between nvim windows, then on to the next tmux or Rex
-- pane at the edge. Rex passes these keys to nvim (see .config/rex/init.lua).
local function navigate(wincmd, tmux_cmd, rex_dir)
  return function()
    if not vim.env.REX_SESSION then
      return vim.cmd(tmux_cmd)
    end
    local win = vim.api.nvim_get_current_win()
    vim.cmd("wincmd " .. wincmd)
    if win == vim.api.nvim_get_current_win() then
      local rex = vim.env.REX_BIN_DIR and (vim.env.REX_BIN_DIR .. "/rex") or "rex"
      vim.system({ rex, "focus", rex_dir })
    end
  end
end

return {
  "christoomey/vim-tmux-navigator",
  init = function()
    vim.g.tmux_navigator_no_mappings = 1
  end,
  cmd = {
    "TmuxNavigateLeft",
    "TmuxNavigateDown",
    "TmuxNavigateUp",
    "TmuxNavigateRight",
  },
  keys = {
    { "<C-h>", navigate("h", "TmuxNavigateLeft", "left") },
    { "<C-j>", navigate("j", "TmuxNavigateDown", "down") },
    { "<C-k>", navigate("k", "TmuxNavigateUp", "up") },
    { "<C-l>", navigate("l", "TmuxNavigateRight", "right") },
  },
}
