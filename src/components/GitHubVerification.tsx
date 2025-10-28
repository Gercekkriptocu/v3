'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CheckCircle2, XCircle, Github, Loader2, ExternalLink, Eye, EyeOff, Upload } from 'lucide-react'

interface GitHubUser {
  login: string
  name: string
  avatar_url: string
}

interface CommitResponse {
  sha: string
  html_url: string
  commit: {
    message: string
  }
}

const commitMessages: string[] = [
  'Fix memory leak in event handlers',
  'Resolve null pointer exception in user service',
  'Patch security vulnerability in authentication',
  'Fix broken links in documentation',
  'Correct typo in configuration file',
  'Fix race condition in async operations',
  'Resolve timezone issues in date handling',
  'Fix CSS styling bug on mobile devices',
  'Patch API endpoint error handling',
  'Fix database connection timeout',
  'Add dark mode support',
  'Implement user profile customization',
  'Add export functionality for reports',
  'Introduce real-time notifications',
  'Add multi-language support',
]

const fileNames: string[] = [
  'README.md',
  'CHANGELOG.md',
  'config.json',
  'utils.js',
  'helpers.ts',
  'index.html',
  'styles.css',
  'app.js',
  'main.py',
  'requirements.txt',
]

const getRandomCommitMessage = (): string => {
  return commitMessages[Math.floor(Math.random() * commitMessages.length)]
}

const getRandomFileName = (): string => {
  return fileNames[Math.floor(Math.random() * fileNames.length)]
}

export function GitHubVerification() {
  const [token, setToken] = useState<string>('')
  const [user, setUser] = useState<GitHubUser | null>(null)
  const [commitCount, setCommitCount] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<boolean>(false)
  const [commitUrl, setCommitUrl] = useState<string>('')
  const [isCreatingCommit, setIsCreatingCommit] = useState<boolean>(false)
  const [showToken, setShowToken] = useState<boolean>(false)
  const [showImportDialog, setShowImportDialog] = useState<boolean>(false)
  const [isImporting, setIsImporting] = useState<boolean>(false)
  const [importRepoName, setImportRepoName] = useState<string>('guild-xyz-project')
  const [importRepoDesc, setImportRepoDesc] = useState<string>('Guild.xyz GitHub verification project')
  const [importSuccess, setImportSuccess] = useState<string>('')

  useEffect(() => {
    const savedToken = localStorage.getItem('github_token')
    if (savedToken) {
      setToken(savedToken)
      handleAutoVerification(savedToken)
    }

    const handleOpenImport = (): void => {
      setShowImportDialog(true)
    }
    window.addEventListener('openImportDialog', handleOpenImport)
    return () => window.removeEventListener('openImportDialog', handleOpenImport)
  }, [])

  const handleAutoVerification = async (accessToken: string): Promise<void> => {
    setLoading(true)
    setError('')
    
    try {
      const userRes = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (!userRes.ok) {
        throw new Error('GitHub kullanıcı bilgileri alınamadı')
      }

      const userData = (await userRes.json()) as GitHubUser
      setUser(userData)

      const searchRes = await fetch(
        `https://api.github.com/search/commits?q=author:${userData.login}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/vnd.github.cloak-preview',
          },
        }
      )

      if (searchRes.ok) {
        const searchData = (await searchRes.json()) as { total_count: number }
        setCommitCount(searchData.total_count)
        
        if (searchData.total_count > 0) {
          setSuccess(true)
        }
      }
      
      localStorage.setItem('github_token', accessToken)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu')
      localStorage.removeItem('github_token')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCommit = async (): Promise<void> => {
    if (!token || !user) return

    setIsCreatingCommit(true)
    setError('')

    try {
      const repoName = 'guild-verification-commit'
      
      const repoCheckRes = await fetch(`https://api.github.com/repos/${user.login}/${repoName}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!repoCheckRes.ok) {
        const createRepoRes = await fetch('https://api.github.com/user/repos', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: repoName,
            description: 'Guild.xyz verification commit',
            private: false,
            auto_init: true,
          }),
        })

        if (!createRepoRes.ok) {
          throw new Error('Repository oluşturulamadı')
        }

        await new Promise(resolve => setTimeout(resolve, 2000))
      }

      const commitMessage = getRandomCommitMessage()
      const fileName = getRandomFileName()
      const timestamp = new Date().toISOString()
      const content = `Guild.xyz verification\nTimestamp: ${timestamp}\nCommit: ${commitMessage}`
      const contentBase64 = btoa(content)

      const fileCheckRes = await fetch(
        `https://api.github.com/repos/${user.login}/${repoName}/contents/${fileName}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      let sha: string | undefined
      if (fileCheckRes.ok) {
        const fileData = (await fileCheckRes.json()) as { sha: string }
        sha = fileData.sha
      }

      const commitRes = await fetch(
        `https://api.github.com/repos/${user.login}/${repoName}/contents/${fileName}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: commitMessage,
            content: contentBase64,
            ...(sha && { sha }),
          }),
        }
      )

      if (!commitRes.ok) {
        throw new Error('Commit oluşturulamadı')
      }

      const commitData = (await commitRes.json()) as { content: CommitResponse }
      setCommitUrl(commitData.content.html_url)
      setSuccess(true)
      setCommitCount(prevCount => prevCount + 1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Commit oluşturulurken hata oluştu')
    } finally {
      setIsCreatingCommit(false)
    }
  }

  const handleReset = (): void => {
    setToken('')
    setUser(null)
    setCommitCount(0)
    setSuccess(false)
    setError('')
    setCommitUrl('')
    localStorage.removeItem('github_token')
  }

  const openGitHubTokenPage = (): void => {
    window.open('https://github.com/settings/tokens/new?description=Guild%20Verification&scopes=repo', '_blank')
  }

  const handleImportProject = async (): Promise<void> => {
    if (!token) {
      setError('Önce GitHub token ile giriş yapmalısınız')
      return
    }

    setIsImporting(true)
    setError('')
    setImportSuccess('')

    try {
      const response = await fetch('/api/github/import-project', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          repoName: importRepoName,
          repoDescription: importRepoDesc,
        }),
      })

      const data = (await response.json()) as { success?: boolean; repoUrl?: string; error?: string }

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Import işlemi başarısız oldu')
      }

      setImportSuccess(data.repoUrl || '')
      setTimeout(() => {
        setShowImportDialog(false)
      }, 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import işlemi sırasında hata oluştu')
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <Card className="w-full max-w-xl bg-gray-800 border-gray-700">
      <CardHeader className="text-center py-4">
        <div className="flex justify-center mb-3">
          <Github className="w-16 h-16 text-white" />
        </div>
        <CardTitle className="text-2xl font-bold text-white mb-2">
          Otomatik Commit Yap!
        </CardTitle>
        <CardDescription className="text-gray-300 text-base">
          &quot;Have at least a commit&quot; görevini tek tıkla tamamlayın
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 p-5">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-2">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
            <p className="text-gray-300 text-sm">Kontrol ediliyor...</p>
          </div>
        ) : !user ? (
          <div className="space-y-4">
            <div className="bg-gray-700 rounded-lg p-4 space-y-2">
              <h3 className="font-semibold text-white text-xl">
                Token Nasıl Alınır?
              </h3>
              <ol className="text-base text-gray-300 space-y-1.5 list-decimal list-inside">
                <li>Butona tıklayın</li>
                <li>&quot;Generate token&quot; basın</li>
                <li>Token&apos;ı kopyalayın</li>
                <li>Buraya yapıştırın</li>
              </ol>
              <Button
                onClick={openGitHubTokenPage}
                variant="outline"
                size="default"
                className="w-full text-base font-bold"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                GitHub Token Oluştur
              </Button>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-300">
                GitHub Token
              </label>
              <div className="relative">
                <Input
                  type={showToken ? 'text' : 'password'}
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="ghp_xxxxxxxxxxxx"
                  className="bg-gray-700 border-gray-600 text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-900/30 border border-red-700 rounded-lg p-2.5">
                <div className="flex items-center gap-2 text-red-400">
                  <XCircle className="w-4 h-4" />
                  <span className="text-xs">{error}</span>
                </div>
              </div>
            )}

            <Button
              onClick={() => handleAutoVerification(token)}
              disabled={!token || loading}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700"
            >
              <Github className="w-4 h-4 mr-2" />
              Devam Et
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-gray-700 rounded-lg p-4">
              <div className="flex items-center gap-2.5">
                <img
                  src={user.avatar_url}
                  alt={user.name}
                  className="w-12 h-12 rounded-full"
                />
                <div>
                  <p className="font-semibold text-white text-sm">{user.name}</p>
                  <p className="text-xs text-gray-400">@{user.login}</p>
                </div>
              </div>
              <Button
                onClick={handleReset}
                variant="ghost"
                size="sm"
                className="text-gray-400"
              >
                Çıkış
              </Button>
            </div>

            {isCreatingCommit ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
              </div>
            ) : (
              <>
                {success && (
                  <div className="bg-green-900/30 border border-green-700 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-green-400">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="font-semibold">Başarılı!</span>
                    </div>
                    <p className="text-sm text-gray-300 mt-2">
                      Toplam commit: <strong>{commitCount}</strong>
                    </p>
                    {commitUrl && (
                      <a
                        href={commitUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-400 underline block mt-2"
                      >
                        Commit&apos;i görüntüle →
                      </a>
                    )}
                  </div>
                )}

                {error && (
                  <div className="bg-red-900/30 border border-red-700 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-red-400">
                      <XCircle className="w-5 h-5" />
                      <span className="text-xs">{error}</span>
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleCreateCommit}
                  disabled={isCreatingCommit}
                  className="w-full bg-gradient-to-r from-green-600 to-green-700"
                >
                  🚀 Otomatik Commit Yap
                </Button>
              </>
            )}
          </div>
        )}
      </CardContent>
      
      {showImportDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg max-w-md w-full p-5 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-white">Projeyi Yükle</h3>
              <button
                onClick={() => setShowImportDialog(false)}
                className="text-gray-400 hover:text-white"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            {isImporting ? (
              <div className="flex flex-col items-center py-8">
                <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
              </div>
            ) : importSuccess ? (
              <div className="bg-green-900/30 border border-green-700 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-400 mb-2">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="font-semibold">Başarılı!</span>
                </div>
                <a
                  href={importSuccess}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-400 underline"
                >
                  Repository&apos;yi Görüntüle →
                </a>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-1.5 block">
                    Repository Adı
                  </label>
                  <Input
                    value={importRepoName}
                    onChange={(e) => setImportRepoName(e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-1.5 block">
                    Açıklama
                  </label>
                  <Input
                    value={importRepoDesc}
                    onChange={(e) => setImportRepoDesc(e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>

                {error && (
                  <div className="bg-red-900/30 border border-red-700 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-red-400">
                      <XCircle className="w-4 h-4" />
                      <span className="text-xs">{error}</span>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={() => setShowImportDialog(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    İptal
                  </Button>
                  <Button
                    onClick={handleImportProject}
                    disabled={!importRepoName || isImporting}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Yükle
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  )
}
