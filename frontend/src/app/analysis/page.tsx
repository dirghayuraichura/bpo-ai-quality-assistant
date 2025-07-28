'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, 
  Smile, 
  Frown, 
  Meh,
  Star,
  GraduationCap,
  Eye,
  Trash2,
  Search,
  Play,
  FileAudio
} from 'lucide-react';
import { apiService, Analysis, AudioFile } from '@/lib/api';
import { toast } from 'sonner';

interface AudioFileWithAnalysis extends AudioFile {
  analysis?: Analysis;
}

export default function AnalysisPage() {
  const searchParams = useSearchParams();
  const transcriptId = searchParams.get('transcriptId')?.replace(/[^a-fA-F0-9]/g, '');
  const audioFileId = searchParams.get('audioFileId')?.replace(/[^a-fA-F0-9]/g, '');
  
  console.log('Analysis page URL params:', { transcriptId, audioFileId });
  
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [audioFiles, setAudioFiles] = useState<AudioFileWithAnalysis[]>([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState<string | null>(null);
  const [deletingAnalysis, setDeletingAnalysis] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [sentimentFilter, setSentimentFilter] = useState<string>('all');
  const [showAnalyzedOnly, setShowAnalyzedOnly] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  // Auto-analyze if audioFileId is provided in URL
  useEffect(() => {
    if (audioFileId && audioFileId !== 'undefined' && !loading) {
      console.log('Auto-analyzing audioFileId:', audioFileId);
      handleAnalyze(audioFileId);
    }
  }, [audioFileId, loading]);

  const fetchData = async (page = 1) => {
    try {
      setLoading(true);
      
      // Fetch both analyses and audio files
      const [analysesResponse, audioFilesResponse] = await Promise.all([
        apiService.getAnalyses(page, 10),
        apiService.getUploads(page, 10)
      ]);
      
      setAnalyses(analysesResponse.data);
      setAudioFiles(audioFilesResponse.data);
      setTotalPages(Math.max(analysesResponse.pagination.total, audioFilesResponse.pagination.total));
      setTotalItems(analysesResponse.pagination.totalItems + audioFilesResponse.pagination.totalItems);
      setCurrentPage(page);
      
      // Handle URL parameters
      if (transcriptId && transcriptId !== 'undefined') {
        const analysis = analysesResponse.data.find(a => a.transcriptId === transcriptId);
        if (analysis) {
          setSelectedAnalysis(analysis);
        }
      } else if (audioFileId && audioFileId !== 'undefined') {
        // If audioFileId is provided, we can analyze it directly
        console.log('AudioFileId provided:', audioFileId);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async (audioFileId: string) => {
    const cleanId = audioFileId?.replace(/[^a-fA-F0-9]/g, '');
    
    if (!cleanId || cleanId === 'undefined') {
      toast.error('Invalid file ID');
      return;
    }

    try {
      setAnalyzing(cleanId);
      toast.info('Starting analysis...');

      // Check if transcript already exists
      let transcriptId;
      try {
        const existingTranscript = await apiService.getTranscriptByAudioFile(cleanId);
        transcriptId = existingTranscript.data.id;
        console.log('Using existing transcript:', transcriptId);
        console.log('Transcript ID type:', typeof transcriptId);
        console.log('Transcript ID length:', transcriptId?.length);
      } catch (error) {
        // Transcript doesn't exist, create new one
        console.log('Creating new transcript for file:', cleanId);
        const transcriptResponse = await apiService.transcribeAudio(cleanId);
        transcriptId = transcriptResponse.data.id;
        console.log('Created new transcript:', transcriptId);
        console.log('New transcript ID type:', typeof transcriptId);
        console.log('New transcript ID length:', transcriptId?.length);
      }
      
      // Validate transcriptId before proceeding
      if (!transcriptId || transcriptId === 'undefined') {
        toast.error('Failed to get valid transcript ID');
        return;
      }
      
      // Clean up transcriptId to ensure it's a valid MongoDB ObjectId
      const cleanTranscriptId = transcriptId?.replace(/[^a-fA-F0-9]/g, '');
      if (cleanTranscriptId.length !== 24) {
        toast.error('Invalid transcript ID format');
        return;
      }
      
      console.log('About to analyze transcript:', cleanTranscriptId);
      
      // Then analyze the transcript
      const analysisResponse = await apiService.analyzeTranscript(cleanTranscriptId);
      
      toast.success('Analysis completed!');
      
      // Navigate to coaching page with the new analysis
      window.location.href = `/coaching?analysisId=${analysisResponse.data.id}`;
      
    } catch (error: any) {
      console.error('Analysis error:', error);
      console.error('Error response:', error.response?.data);
      toast.error(error.response?.data?.message || 'Analysis failed');
    } finally {
      setAnalyzing(null);
    }
  };

  const handleDeleteAnalysis = async (analysisId: string) => {
    if (!analysisId || analysisId === 'undefined') {
      toast.error('Invalid analysis ID');
      return;
    }

    try {
      setDeletingAnalysis(analysisId);
      await apiService.deleteAnalysis(analysisId);
      toast.success('Analysis deleted successfully!');
      await fetchData(currentPage);
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error(error.response?.data?.message || 'Failed to delete analysis');
    } finally {
      setDeletingAnalysis(null);
    }
  };

  const handleGenerateCoaching = async (analysisId: string) => {
    if (!analysisId || analysisId === 'undefined') {
      toast.error('Invalid analysis ID');
      return;
    }

    try {
      toast.info('Generating coaching plan...');

      // Check if coaching plan already exists
      try {
        const existingPlan = await apiService.getCoachingPlanByAnalysis(analysisId);
        toast.success('Coaching plan already exists!');
        window.location.href = `/coaching?analysisId=${analysisId}`;
        return;
      } catch (error) {
        // Coaching plan doesn't exist, create new one
        console.log('Creating new coaching plan for analysis:', analysisId);
      }

      const response = await apiService.generateCoachingPlan(analysisId);
      
      toast.success('Coaching plan generated!');
      
      // Navigate to coaching page
      window.location.href = `/coaching?analysisId=${analysisId}`;
      
    } catch (error: any) {
      console.error('Coaching generation error:', error);
      toast.error(error.response?.data?.message || 'Failed to generate coaching plan');
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return <Smile className="w-5 h-5 text-green-500" />;
      case 'negative':
        return <Frown className="w-5 h-5 text-red-500" />;
      default:
        return <Meh className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'bg-green-100 text-green-800';
      case 'negative':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Combine audio files and analyses, showing audio files that don't have analyses
  const allItems = [
    ...audioFiles.filter(audioFile => !analyses.some(a => a.audioFileId === audioFile.id)),
    ...analyses
  ];

  const filteredItems = allItems.filter(item => {
    const matchesSearch = 'originalName' in item 
      ? item.originalName?.toLowerCase().includes(searchTerm.toLowerCase())
      : item.audioFile?.originalName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.summary.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSentiment = sentimentFilter === 'all' || 
      ('sentiment' in item ? item.sentiment.overall === sentimentFilter : true);
    
    const matchesAnalyzedOnly = !showAnalyzedOnly || 'sentiment' in item;
    
    return matchesSearch && matchesSentiment && matchesAnalyzedOnly;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analysis</h1>
          <p className="text-gray-600 mt-1">
            AI-powered conversation analysis and insights
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-20 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analysis</h1>
        <p className="text-gray-600 mt-1">
          AI-powered conversation analysis and insights
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Audio Files & Analyses ({totalItems})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search files..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full sm:w-40">
              <Select value={sentimentFilter} onValueChange={setSentimentFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Sentiment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sentiments</SelectItem>
                  <SelectItem value="positive">Positive</SelectItem>
                  <SelectItem value="neutral">Neutral</SelectItem>
                  <SelectItem value="negative">Negative</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full sm:w-48">
              <Select value={showAnalyzedOnly ? "analyzed" : "all"} onValueChange={(value) => setShowAnalyzedOnly(value === "analyzed")}>
                <SelectTrigger>
                  <SelectValue placeholder="Show" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Files</SelectItem>
                  <SelectItem value="analyzed">Analyzed Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {filteredItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredItems.map((item) => {
                const isAnalysis = 'sentiment' in item;
                const isAudioFile = 'originalName' in item;
                
                return (
                  <Card 
                    key={item.id} 
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => isAnalysis ? setSelectedAnalysis(item as Analysis) : null}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center">
                          {isAnalysis ? (
                            <Brain className="w-5 h-5 mr-2 text-purple-600" />
                          ) : (
                            <FileAudio className="w-5 h-5 mr-2 text-gray-600" />
                          )}
                          {isAnalysis ? 'Analysis' : 'Audio File'}
                        </CardTitle>
                        <Badge className={isAnalysis ? getSentimentColor(item.sentiment.overall) : 'bg-gray-100 text-gray-800'}>
                          {isAnalysis ? item.sentiment.overall : 'Ready'}
                        </Badge>
                      </div>
                      <CardDescription>
                        {isAnalysis 
                          ? `${item.audioFile?.originalName || 'Audio File'} • ${new Date(item.createdAt).toLocaleDateString()}`
                          : `${item.originalName} • ${new Date(item.uploadedAt).toLocaleDateString()}`
                        }
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {isAnalysis ? (
                        <>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Sentiment:</span>
                            <div className="flex items-center space-x-1">
                              {getSentimentIcon(item.sentiment.overall)}
                              <span className="text-sm font-medium">
                                {item.sentiment.overall}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Satisfaction:</span>
                            <span className={`text-sm font-medium ${getPerformanceColor(item.customerSatisfaction.score)}`}>
                              {item.customerSatisfaction.score}/10
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Resolved:</span>
                            <Badge variant={item.issueResolution.wasResolved ? "default" : "secondary"}>
                              {item.issueResolution.wasResolved ? 'Yes' : 'No'}
                            </Badge>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-sm text-gray-700">
                              Ready for analysis
                            </p>
                          </div>
                        </>
                      )}

                      <div className="flex space-x-2">
                        {isAnalysis ? (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedAnalysis(item as Analysis);
                              }}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleGenerateCoaching(item.id);
                              }}
                            >
                              <GraduationCap className="w-4 h-4 mr-1" />
                              Coach
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteAnalysis(item.id);
                              }}
                              disabled={deletingAnalysis === item.id}
                              className="text-red-600 hover:text-red-700"
                            >
                              {deletingAnalysis === item.id ? (
                                <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAnalyze(item.id);
                              }}
                              disabled={analyzing === item.id}
                            >
                              {analyzing === item.id ? (
                                <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <Brain className="w-4 h-4 mr-1" />
                              )}
                              Analyze
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.location.href = `/upload`;
                              }}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Brain className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>No files found</p>
              <p className="text-sm">Upload an audio file to get started</p>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-500">
                Showing {((currentPage - 1) * 10) + 1} to {Math.min(currentPage * 10, totalItems)} of {totalItems} items
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchData(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="px-3 py-2 text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchData(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedAnalysis && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-6xl max-h-[90vh] overflow-hidden">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Brain className="w-5 h-5 mr-2" />
                  Analysis Details
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedAnalysis(null)}
                >
                  ×
                </Button>
              </div>
              <CardDescription>
                {selectedAnalysis.audioFile?.originalName} • {new Date(selectedAnalysis.createdAt).toLocaleString()}
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-y-auto max-h-96">
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="sentiment">Sentiment</TabsTrigger>
                  <TabsTrigger value="metrics">Metrics</TabsTrigger>
                  <TabsTrigger value="topics">Topics</TabsTrigger>
                  <TabsTrigger value="summary">Summary</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center">
                          {getSentimentIcon(selectedAnalysis.sentiment.overall)}
                          Sentiment
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{selectedAnalysis.sentiment.overall}</div>
                        <p className="text-xs text-gray-500">
                          Confidence: {(selectedAnalysis.sentiment.confidence * 100).toFixed(1)}%
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center">
                          <Star className="w-4 h-4 mr-1" />
                          Satisfaction
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className={`text-2xl font-bold ${getPerformanceColor(selectedAnalysis.customerSatisfaction.score)}`}>
                          {selectedAnalysis.customerSatisfaction.score}/10
                        </div>
                        <p className="text-xs text-gray-500">
                          Customer satisfaction score
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Resolution</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {selectedAnalysis.issueResolution.wasResolved ? 'Resolved' : 'Unresolved'}
                        </div>
                        <p className="text-xs text-gray-500">
                          {selectedAnalysis.issueResolution.resolutionTime} minutes
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="sentiment" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Emotion Analysis</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {selectedAnalysis.emotions.map((emotion, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <span className="capitalize">{emotion.emotion}</span>
                            <div className="flex items-center space-x-2">
                              <Progress value={emotion.intensity * 100} className="w-20" />
                              <span className="text-sm text-gray-500">
                                {(emotion.intensity * 100).toFixed(0)}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="metrics" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Communication Metrics</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between">
                          <span>Speaking Rate:</span>
                          <span>{selectedAnalysis.communicationMetrics.speakingRate} wpm</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Pause Frequency:</span>
                          <span>{selectedAnalysis.communicationMetrics.pauseFrequency}/min</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Interruptions:</span>
                          <span>{selectedAnalysis.communicationMetrics.interruptionCount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Clarity Score:</span>
                          <span>{(selectedAnalysis.communicationMetrics.clarityScore * 100).toFixed(1)}%</span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Compliance</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span>Compliance Score:</span>
                            <span>{(selectedAnalysis.compliance.score * 100).toFixed(1)}%</span>
                          </div>
                          {selectedAnalysis.compliance.violations.length > 0 && (
                            <div>
                              <p className="text-sm font-medium mb-2">Violations:</p>
                              <ul className="text-sm text-red-600 space-y-1">
                                {selectedAnalysis.compliance.violations.map((violation, index) => (
                                  <li key={index}>• {violation}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="topics" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Key Topics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {selectedAnalysis.keyTopics.map((topic, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <span>{topic.topic}</span>
                            <div className="flex items-center space-x-2">
                              <Progress value={topic.relevance * 100} className="w-20" />
                              <span className="text-sm text-gray-500">
                                {(topic.relevance * 100).toFixed(0)}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="summary" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Analysis Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 leading-relaxed">
                        {selectedAnalysis.summary}
                      </p>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </CardContent>
            <div className="p-6 border-t">
              <div className="flex space-x-2">
                <Button
                  onClick={() => handleGenerateCoaching(selectedAnalysis.id)}
                >
                  <GraduationCap className="w-4 h-4 mr-2" />
                  Generate Coaching Plan
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setSelectedAnalysis(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
} 