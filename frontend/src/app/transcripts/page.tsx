'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  FileText, 
  Play, 
  Brain, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  Download,
  Eye,
  Trash2,
  Search,
  FileAudio
} from 'lucide-react';
import { apiService, Transcript, AudioFile } from '@/lib/api';
import { toast } from 'sonner';

interface TranscriptWithAudio extends Transcript {
  audioFile?: AudioFile;
}

interface AudioFileWithTranscript extends AudioFile {
  transcript?: Transcript;
}

export default function TranscriptsPage() {
  const searchParams = useSearchParams();
  const audioFileId = searchParams.get('audioFileId');
  
  const [transcripts, setTranscripts] = useState<TranscriptWithAudio[]>([]);
  const [audioFiles, setAudioFiles] = useState<AudioFileWithTranscript[]>([]);
  const [selectedTranscript, setSelectedTranscript] = useState<TranscriptWithAudio | null>(null);
  const [loading, setLoading] = useState(true);
  const [transcribing, setTranscribing] = useState<string | null>(null);
  const [deletingTranscript, setDeletingTranscript] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [languageFilter, setLanguageFilter] = useState<string>('all');
  const [confidenceFilter, setConfidenceFilter] = useState<string>('all');
  const [showTranscribedOnly, setShowTranscribedOnly] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async (page = 1) => {
    try {
      setLoading(true);
      
      // Fetch both transcripts and audio files
      const [transcriptsResponse, audioFilesResponse] = await Promise.all([
        apiService.getTranscripts(page, 10),
        apiService.getUploads(page, 10)
      ]);
      
      setTranscripts(transcriptsResponse.data);
      setAudioFiles(audioFilesResponse.data);
      setTotalPages(Math.max(transcriptsResponse.pagination.total, audioFilesResponse.pagination.total));
      setTotalItems(transcriptsResponse.pagination.totalItems + audioFilesResponse.pagination.totalItems);
      setCurrentPage(page);
      
      // If audioFileId is provided and valid, find the corresponding transcript
      if (audioFileId && audioFileId !== 'undefined') {
        const transcript = transcriptsResponse.data.find(t => t.audioFileId === audioFileId);
        if (transcript) {
          setSelectedTranscript(transcript);
        }
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleTranscribe = async (audioFileId: string) => {
    if (!audioFileId || audioFileId === 'undefined') {
      toast.error('Invalid file ID');
      return;
    }

    try {
      setTranscribing(audioFileId);
      toast.info('Starting transcription...');

      const response = await apiService.transcribeAudio(audioFileId);
      
      toast.success('Transcription completed!');
      
      // Refresh data
      await fetchData();
      
    } catch (error: any) {
      console.error('Transcription error:', error);
      toast.error(error.response?.data?.message || 'Transcription failed');
    } finally {
      setTranscribing(null);
    }
  };

  const handleDeleteTranscript = async (transcriptId: string) => {
    if (!transcriptId || transcriptId === 'undefined') {
      toast.error('Invalid transcript ID');
      return;
    }

    try {
      setDeletingTranscript(transcriptId);
      await apiService.deleteTranscript(transcriptId);
      toast.success('Transcript deleted successfully!');
      await fetchData(currentPage);
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error(error.response?.data?.message || 'Failed to delete transcript');
    } finally {
      setDeletingTranscript(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'processing':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatConfidence = (confidence: number) => {
    return `${(confidence * 100).toFixed(1)}%`;
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-600';
    if (confidence >= 0.7) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Combine audio files and transcripts, showing audio files that don't have transcripts
  const allItems = [
    ...audioFiles.filter(audioFile => !transcripts.some(t => t.audioFileId === audioFile.id)),
    ...transcripts
  ];

  const filteredItems = allItems.filter(item => {
    const matchesSearch = 'originalName' in item 
      ? item.originalName?.toLowerCase().includes(searchTerm.toLowerCase())
      : item.audioFile?.originalName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.text.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesLanguage = languageFilter === 'all' || 
      ('language' in item ? item.language === languageFilter : true);
    
    const matchesConfidence = confidenceFilter === 'all' || 
      ('confidence' in item ? 
        (confidenceFilter === 'high' && item.confidence >= 0.9) ||
        (confidenceFilter === 'medium' && item.confidence >= 0.7 && item.confidence < 0.9) ||
        (confidenceFilter === 'low' && item.confidence < 0.7) : true);
    
    const matchesTranscribedOnly = !showTranscribedOnly || 'text' in item;
    
    return matchesSearch && matchesLanguage && matchesConfidence && matchesTranscribedOnly;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Transcripts</h1>
          <p className="text-gray-600 mt-1">
            View and manage your audio transcriptions
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
        <h1 className="text-3xl font-bold text-gray-900">Transcripts</h1>
        <p className="text-gray-600 mt-1">
          View and manage your audio transcriptions
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Audio Files & Transcripts ({totalItems})</CardTitle>
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
            <div className="w-full sm:w-32">
              <Select value={languageFilter} onValueChange={setLanguageFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Languages</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full sm:w-40">
              <Select value={confidenceFilter} onValueChange={setConfidenceFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Confidence" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Confidence</SelectItem>
                  <SelectItem value="high">High (≥90%)</SelectItem>
                  <SelectItem value="medium">Medium (70-89%)</SelectItem>
                  <SelectItem value="low">Low (≤70%)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full sm:w-48">
              <Select value={showTranscribedOnly ? "transcribed" : "all"} onValueChange={(value) => setShowTranscribedOnly(value === "transcribed")}>
                <SelectTrigger>
                  <SelectValue placeholder="Show" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Files</SelectItem>
                  <SelectItem value="transcribed">Transcribed Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {filteredItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredItems.map((item) => {
                const isTranscript = 'text' in item;
                const isAudioFile = 'originalName' in item;
                
                return (
                  <Card 
                    key={item.id} 
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => isTranscript ? setSelectedTranscript(item as TranscriptWithAudio) : null}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center">
                          {isTranscript ? (
                            <FileText className="w-5 h-5 mr-2 text-blue-600" />
                          ) : (
                            <FileAudio className="w-5 h-5 mr-2 text-gray-600" />
                          )}
                          {isTranscript ? 'Transcript' : 'Audio File'}
                        </CardTitle>
                        <Badge className={isTranscript ? getStatusColor('completed') : getStatusColor(item.status)}>
                          {isTranscript ? 'Completed' : item.status}
                        </Badge>
                      </div>
                      <CardDescription>
                        {isTranscript 
                          ? `${item.audioFile?.originalName || 'Audio File'} • ${new Date(item.createdAt).toLocaleDateString()}`
                          : `${item.originalName} • ${new Date(item.uploadedAt).toLocaleDateString()}`
                        }
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {isTranscript ? (
                        <>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Confidence:</span>
                            <span className={`text-sm font-medium ${getConfidenceColor(item.confidence)}`}>
                              {formatConfidence(item.confidence)}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Language:</span>
                            <span className="text-sm font-medium">{item.language.toUpperCase()}</span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Processing:</span>
                            <span className="text-sm font-medium">{item.processingTime}ms</span>
                          </div>

                          <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-sm text-gray-700">
                              {item.text.substring(0, 150)}
                              {item.text.length > 150 && '...'}
                            </p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Size:</span>
                            <span className="text-sm font-medium">{formatFileSize(item.size)}</span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Type:</span>
                            <span className="text-sm font-medium">{item.mimetype}</span>
                          </div>

                          {item.duration && (
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">Duration:</span>
                              <span className="text-sm font-medium">{formatDuration(item.duration)}</span>
                            </div>
                          )}

                          <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-sm text-gray-700">
                              Ready for transcription
                            </p>
                          </div>
                        </>
                      )}

                      <div className="flex space-x-2">
                        {isTranscript ? (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTranscript(item as TranscriptWithAudio);
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
                                const cleanId = item.audioFileId?.replace(/[^a-fA-F0-9]/g, '');
                                const url = `/analysis?audioFileId=${cleanId}`;
                                console.log('Navigating to:', url);
                                window.location.href = url;
                              }}
                            >
                              <Brain className="w-4 h-4 mr-1" />
                              Analyze
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteTranscript(item.id);
                              }}
                              disabled={deletingTranscript === item.id}
                              className="text-red-600 hover:text-red-700"
                            >
                              {deletingTranscript === item.id ? (
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
                                handleTranscribe(item.id);
                              }}
                              disabled={transcribing === item.id}
                            >
                              {transcribing === item.id ? (
                                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <Play className="w-4 h-4 mr-1" />
                              )}
                              Transcribe
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
              <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
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

      {selectedTranscript && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-4xl max-h-[80vh] overflow-hidden">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Transcript Details
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedTranscript(null)}
                >
                  ×
                </Button>
              </div>
              <CardDescription>
                {selectedTranscript.audioFile?.originalName} • {new Date(selectedTranscript.createdAt).toLocaleString()}
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-y-auto max-h-96">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm font-medium text-gray-600">Confidence</p>
                    <p className={`text-lg font-bold ${getConfidenceColor(selectedTranscript.confidence)}`}>
                      {formatConfidence(selectedTranscript.confidence)}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm font-medium text-gray-600">Language</p>
                    <p className="text-lg font-bold">{selectedTranscript.language.toUpperCase()}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm font-medium text-gray-600">Processing Time</p>
                    <p className="text-lg font-bold">{selectedTranscript.processingTime}ms</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-3">Full Transcript</h3>
                  <div className="bg-gray-50 p-4 rounded-lg max-h-64 overflow-y-auto">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {selectedTranscript.text}
                    </p>
                  </div>
                </div>

                {selectedTranscript.segments && selectedTranscript.segments.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium mb-3">Segments</h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {selectedTranscript.segments.map((segment, index) => (
                        <div key={index} className="bg-gray-50 p-3 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-gray-500">
                              {formatDuration(segment.start)} - {formatDuration(segment.end)}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatConfidence(segment.confidence)}
                            </span>
                          </div>
                          <p className="text-sm">{segment.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
            <div className="p-6 border-t">
              <div className="flex space-x-2">
                <Button
                  onClick={() => {
                    const cleanId = selectedTranscript.audioFileId?.replace(/[^a-fA-F0-9]/g, '');
                    const url = `/analysis?audioFileId=${cleanId}`;
                    console.log('Navigating to:', url);
                    window.location.href = url;
                  }}
                >
                  <Brain className="w-4 h-4 mr-2" />
                  Analyze
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    const blob = new Blob([selectedTranscript.text], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${selectedTranscript.audioFile?.originalName || 'transcript'}.txt`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setSelectedTranscript(null)}
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