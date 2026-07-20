using System.Diagnostics;
using System.IO.Compression;

namespace Existentia.Launcher;

class Program
{
    // ========================================================================
    // CONFIGURAÇÃO — Edite aqui se mudar de lugar
    // ========================================================================
    static readonly string Root = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));
    static readonly string VaultPath = @"D:\Meu Drive\DriveSyncFiles\Obsidian\Nowa Existentia";
    static readonly string ContentPath = Path.Combine(Root, "Existentia.Wiki", "quartz", "content");
    static readonly string BackupDir = Path.Combine(Root, "Existentia.Wiki", "backups");
    // ========================================================================

    static readonly List<Service> Services = new()
    {
        new("Blazor (Web)", "dotnet watch run", Path.Combine(Root, "Existentia.Web"), "http://localhost:5213", openBrowser: false),
        new("Quartz (Wiki)", "npx quartz build --serve", Path.Combine(Root, "Existentia.Wiki", "quartz"), "http://localhost:8080", openBrowser: true),
    };

    static void Main(string[] args)
    {
        Console.Title = "Existentia Launcher";
        Console.CursorVisible = false;

        while (true)
        {
            Console.Clear();
            DrawHeader();

            for (int i = 0; i < Services.Count; i++)
            {
                var s = Services[i];
                var status = s.IsRunning ? "[Rodando]" : "[Parado]";
                var color = s.IsRunning ? ConsoleColor.Green : ConsoleColor.DarkGray;

                Console.Write($"  [{i + 1}]");
                Console.Write($" {s.Name,-25} ", ConsoleColor.Cyan);
                Console.ForegroundColor = color;
                Console.WriteLine(status);
                Console.ResetColor();
            }

            Console.WriteLine("  [3] Obsidian (Vault)");
            Console.WriteLine();
            Console.WriteLine("  [A] Funções Avançadas");
            Console.WriteLine("  [O] Abrir no navegador    [S] Sair", ConsoleColor.DarkYellow);
            Console.WriteLine();
            Console.Write("  Opção: ", ConsoleColor.White);

            var key = Console.ReadKey(true).KeyChar;
            Console.WriteLine();

            if (key == 's' || key == 'S')
            {
                StopAll();
                break;
            }

            if (key == 'o' || key == 'O')
            {
                Console.Write("  Abrir serviço nº: ");
                if (int.TryParse(Console.ReadKey(true).KeyChar.ToString(), out int n) && n >= 1 && n <= Services.Count)
                {
                    var svc = Services[n - 1];
                    if (svc.IsRunning && !string.IsNullOrEmpty(svc.Url))
                    {
                        OpenBrowser(svc.Url);
                        ShowMsg($"Abrindo {svc.Url}", ConsoleColor.Green);
                    }
                    else if (!svc.IsRunning)
                        ShowMsg("Serviço não está rodando.", ConsoleColor.Red);
                    else
                        ShowMsg("Sem URL configurada.", ConsoleColor.DarkYellow);
                }
                Thread.Sleep(800);
                continue;
            }

            if (key == 'a' || key == 'A')
            {
                ShowAdvancedMenu();
                continue;
            }

            if (key == '3')
            {
                if (Directory.Exists(VaultPath))
                {
                    var vaultName = new DirectoryInfo(VaultPath).Name;
                    var uri = $"obsidian://open?vault={Uri.EscapeDataString(vaultName)}";
                    Process.Start(new ProcessStartInfo(uri) { UseShellExecute = true });
                    ShowMsg("Abrindo vault no Obsidian...", ConsoleColor.Green);
                }
                else
                {
                    ShowMsg("Vault não encontrado:", ConsoleColor.Red);
                    ShowMsg(VaultPath, ConsoleColor.DarkGray);
                    ShowMsg("Possível causa: drive não conectado.", ConsoleColor.DarkGray);
                }
                Thread.Sleep(1000);
                continue;
            }

            if (int.TryParse(key.ToString(), out int idx) && idx >= 1 && idx <= Services.Count)
            {
                var svc = Services[idx - 1];
                if (svc.IsRunning)
                {
                    Stop(svc);
                    ShowMsg($"{svc.Name} parado.", ConsoleColor.Red);
                }
                else
                {
                    if (!EnsureDependencies(svc)) continue;
                    Start(svc);
                    ShowMsg($"{svc.Name} iniciado!", ConsoleColor.Green);
                    if (svc.OpenBrowser && !string.IsNullOrEmpty(svc.Url))
                    {
                        ShowMsg("Aguardando servidor...", ConsoleColor.DarkGray);
                        WaitForServer(svc.Url);
                        OpenBrowser(svc.Url);
                    }
                }
                Thread.Sleep(1000);
            }
        }
    }

    // ========================================================================
    // FUNÇÕES AVANÇADAS
    // ========================================================================
    static void ShowAdvancedMenu()
    {
        while (true)
        {
            Console.Clear();
            DrawHeader();
            Console.ForegroundColor = ConsoleColor.DarkYellow;
            Console.WriteLine("  ═══ Funções Avançadas ═══");
            Console.ResetColor();
            Console.WriteLine();

            var vaultOk = Directory.Exists(VaultPath);
            var vaultStatus = vaultOk ? "encontrado" : "NÃO ENCONTRADO";
            var vaultColor = vaultOk ? ConsoleColor.Green : ConsoleColor.Red;
            Console.Write("  Vault: ");
            Console.ForegroundColor = vaultColor;
            Console.WriteLine(VaultPath);
            Console.ResetColor();
            Console.Write($"  Status: ", ConsoleColor.DarkGray);
            Console.ForegroundColor = vaultColor;
            Console.WriteLine(vaultStatus);
            Console.ResetColor();
            Console.WriteLine();

            Console.WriteLine("  [1] Copiar vault → content");
            Console.WriteLine("  [2] Backup do content (zip)");
            Console.WriteLine("  [V] Abrir vault no Explorer");
            Console.WriteLine();
            Console.WriteLine("  [Voltar = Enter]", ConsoleColor.DarkYellow);
            Console.WriteLine();
            Console.Write("  Opção: ", ConsoleColor.White);

            var key = Console.ReadKey(true).KeyChar;
            Console.WriteLine();

            if (key == '\r' || key == '\n')
                break;

            if (key == 'v' || key == 'V')
            {
                if (vaultOk)
                    Process.Start(new ProcessStartInfo(VaultPath) { UseShellExecute = true });
                else
                    ShowMsg("Vault não encontrado. Verifique o caminho.", ConsoleColor.Red);
                Thread.Sleep(1000);
                continue;
            }

            if (key == '1')
                CopyVaultToContent();
            else if (key == '2')
                BackupContent();
        }
    }

    static void CopyVaultToContent()
    {
        if (!Directory.Exists(VaultPath))
        {
            ShowMsg("Vault não encontrado. Verifique o caminho:", ConsoleColor.Red);
            ShowMsg(VaultPath, ConsoleColor.DarkGray);
            ShowMsg("Possível causa: drive não conectado.", ConsoleColor.DarkGray);
            Thread.Sleep(2000);
            return;
        }

        ShowMsg("Limpando content antigo...", ConsoleColor.Cyan);
        if (Directory.Exists(ContentPath))
            Directory.Delete(ContentPath, recursive: true);

        ShowMsg("Copiando vault para content...", ConsoleColor.Cyan);
        var files = Directory.GetFiles(VaultPath, "*", SearchOption.AllDirectories);
        var copied = 0;

        foreach (var file in files)
        {
            var relPath = Path.GetRelativePath(VaultPath, file);
            var dest = Path.Combine(ContentPath, relPath);
            var destDir = Path.GetDirectoryName(dest)!;

            if (!Directory.Exists(destDir))
                Directory.CreateDirectory(destDir);

            File.Copy(file, dest);
            copied++;
            Console.Write($"\r  {copied}/{files.Length} arquivos...");
        }

        Console.WriteLine();
        ShowMsg($"Pronto! {copied} arquivos copiados.", ConsoleColor.Green);
        Thread.Sleep(1500);
    }

    static void BackupContent()
    {
        if (!Directory.Exists(ContentPath))
        {
            ShowMsg("Pasta content não encontrada.", ConsoleColor.Red);
            Thread.Sleep(1500);
            return;
        }

        if (!Directory.Exists(BackupDir))
            Directory.CreateDirectory(BackupDir);

        var timestamp = DateTime.Now.ToString("yyyy-MM-dd_HHmm");
        var zipName = $"existentia-backup-{timestamp}.zip";
        var zipPath = Path.Combine(BackupDir, zipName);

        ShowMsg("Criando backup...", ConsoleColor.Cyan);
        ZipFile.CreateFromDirectory(ContentPath, zipPath, CompressionLevel.Optimal, includeBaseDirectory: false);

        var size = new FileInfo(zipPath).Length / 1024;
        ShowMsg($"Backup criado!", ConsoleColor.Green);
        ShowMsg(zipPath, ConsoleColor.DarkGray);
        ShowMsg($"{size} KB", ConsoleColor.DarkGray);
        Thread.Sleep(2000);
    }

    // ========================================================================
    // HELPERS
    // ========================================================================

    static bool EnsureDependencies(Service svc)
    {
        if (svc.Name != "Quartz (Wiki)") return true;

        var nodeModules = Path.Combine(svc.WorkDir, "node_modules");
        if (!Directory.Exists(nodeModules))
        {
            ShowMsg("node_modules não encontrado. Rodando npm install...", ConsoleColor.Cyan);
            var psi = new ProcessStartInfo
            {
                FileName = "npm",
                Arguments = "install",
                WorkingDirectory = svc.WorkDir,
                UseShellExecute = true,
                CreateNoWindow = false,
            };
            var proc = Process.Start(psi);
            proc?.WaitForExit();

            if (proc?.ExitCode != 0)
            {
                ShowMsg("Falha ao instalar dependências do Quartz.", ConsoleColor.Red);
                Thread.Sleep(1500);
                return false;
            }

            ShowMsg("Dependências instaladas!", ConsoleColor.Green);
            Thread.Sleep(500);
        }

        return true;
    }

    static void DrawHeader()
    {
        Console.ForegroundColor = ConsoleColor.DarkCyan;
        Console.WriteLine("  ╔══════════════════════════════════════╗");
        Console.WriteLine("  ║         EXISTENTIA LAUNCHER          ║");
        Console.WriteLine("  ╚══════════════════════════════════════╝");
        Console.ResetColor();
        Console.WriteLine();
    }

    static void Start(Service svc)
    {
        var batPath = Path.Combine(Path.GetTempPath(), $"existentia-{svc.Name.Replace(" ", "").Replace("(", "").Replace(")", "").ToLower()}.bat");
        var content = $"@echo off\ncd /d \"{svc.WorkDir}\"\ntitle {svc.Name}\n{svc.Command} {svc.Args}\npause";
        File.WriteAllText(batPath, content);

        svc.Process = Process.Start(new ProcessStartInfo
        {
            FileName = batPath,
            UseShellExecute = true,
        });
    }

    static void Stop(Service svc)
    {
        if (svc.Process == null || svc.Process.HasExited) return;
        try
        {
            svc.Process.Kill(entireProcessTree: true);
        }
        catch { }
        svc.Process = null;
    }

    static void StopAll()
    {
        foreach (var s in Services)
            Stop(s);
    }

    static void OpenBrowser(string url)
    {
        Process.Start(new ProcessStartInfo(url) { UseShellExecute = true });
    }

    static void WaitForServer(string url)
    {
        using var http = new HttpClient { Timeout = TimeSpan.FromSeconds(1) };
        var deadline = DateTime.Now.AddSeconds(30);

        while (DateTime.Now < deadline)
        {
            try
            {
                var resp = http.GetAsync(url).Result;
                if ((int)resp.StatusCode < 500)
                    return;
            }
            catch { }

            Thread.Sleep(500);
        }

        ShowMsg("Servidor não respondeu em 30s. Abrir manualmente com [O].", ConsoleColor.DarkYellow);
    }

    static void ShowMsg(string msg, ConsoleColor color)
    {
        Console.ForegroundColor = color;
        Console.WriteLine($"  {msg}");
        Console.ResetColor();
    }
}

class Service
{
    public string Name;
    public string Command;
    public string Args;
    public string WorkDir;
    public string Url;
    public bool OpenBrowser;
    public Process? Process;
    public bool IsRunning => Process != null && !Process.HasExited;

    public Service(string name, string command, string workDir, string url, bool openBrowser = true)
    {
        Name = name;
        Command = command;
        Args = "";
        WorkDir = workDir;
        Url = url;
        OpenBrowser = openBrowser;
    }
}
