'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Upload, 
  FileAudio, 
  X, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  Trash2,
  Eye,
  FileText,
  Search,
  Play,
  Brain,
  GraduationCap
} from 'lucide-react';
import { apiService, AudioFile } from '@/lib/api';
import { toast } from 'sonner';

interface UploadedFile extends AudioFile {
  id: string;
  originalName: string;
  filename: string;
  size: number;
  mimetype: string;
  uploadedAt: string;
  status: 'uploaded' | 'processing' | 'completed' | 'failed';
  duration?: number;
}

export default function UploadPage() {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deletingFile, setDeletingFile] = useState<string | null>(null);
  const [transcribing, setTranscribing] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState<string | null>(null);
  const [generatingCoaching, setGeneratingCoaching] = useState<string | null>(null);
  const router = useRouter();

  const fetchUploadedFiles = async (page = 1) => {
    try {
      setLoading(true);
      const response = await apiService.getUploads(page, 10);
      console.log('Fetched uploaded files:', response.data);
      setUploadedFiles(response.data);
      setTotalPages(response.pagination.total);
      setTotalItems(response.pagination.totalItems);
      setCurrentPage(response.pagination.current);
    } catch (error) {
      console.error('Failed to fetch uploaded files:', error);
      toast.error('Failed to load uploaded files');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUploadedFiles();
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const audioFiles = files.filter(file => 
      file.type.startsWith('audio/') || 
      file.name.toLowerCase().endsWith('.wav') ||
      file.name.toLowerCase().endsWith('.mp3')
    );

    if (audioFiles.length > 0) {
      handleFileUpload(audioFiles[0]);
    } else {
      toast.error('Please select a valid audio file (.wav or .mp3)');
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileUpload = async (file: File) => {
    // Validate file type
    if (!file.type.startsWith('audio/') && 
        !file.name.toLowerCase().endsWith('.wav') && 
        !file.name.toLowerCase().endsWith('.mp3')) {
      toast.error('Please select a valid audio file (.wav or .mp3)');
      return;
    }

    // Validate file size (50MB limit)
    if (file.size > 50 * 1024 * 1024) {
      toast.error('File size must be less than 50MB');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const response = await apiService.uploadAudioFile(file);
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      toast.success('File uploaded successfully!');

      // Refresh the file list
      await fetchUploadedFiles();

    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!fileId || fileId === 'undefined') {
      toast.error('Invalid file ID');
      return;
    }

    try {
      setDeletingFile(fileId);
      await apiService.deleteUpload(fileId);
      toast.success('File deleted successfully!');
      await fetchUploadedFiles(currentPage);
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error(error.response?.data?.message || 'Failed to delete file');
    } finally {
      setDeletingFile(null);
    }
  };

  const handleTranscribe = async (fileId: string) => {
    console.log('Transcribing file with ID:', fileId);
    
    if (!fileId || fileId === 'undefined') {
      toast.error('Invalid file ID');
      return;
    }

    try {
      setTranscribing(fileId);
      toast.info('Starting transcription...');

      const response = await apiService.transcribeAudio(fileId);
      
      toast.success('Transcription completed!');
      
      // Refresh the file list
      await fetchUploadedFiles();
      
    } catch (error: any) {
      console.error('Transcription error:', error);
      toast.error(error.response?.data?.message || 'Transcription failed');
    } finally {
      setTranscribing(null);
    }
  };

  const handleAnalyze = async (fileId: string) => {
    if (!fileId || fileId === 'undefined') {
      toast.error('Invalid file ID');
      return;
    }

    try {
      setAnalyzing(fileId);
      toast.info('Starting analysis...');

      // Check if transcript already exists
      let transcriptId;
      try {
        const existingTranscript = await apiService.getTranscriptByAudioFile(fileId);
        transcriptId = existingTranscript.data.id;
        console.log('Using existing transcript:', transcriptId);
      } catch (error) {
        // Transcript doesn't exist, create new one
        console.log('Creating new transcript for file:', fileId);
        const transcriptResponse = await apiService.transcribeAudio(fileId);
        transcriptId = transcriptResponse.data.id;
      }
      
      // Then analyze the transcript
      const analysisResponse = await apiService.analyzeTranscript(transcriptId);
      
      toast.success('Analysis completed!');
      
      // Navigate to coaching page with the new analysis
      window.location.href = `/coaching?analysisId=${analysisResponse.data.id}`;
      
    } catch (error: any) {
      console.error('Analysis error:', error);
      toast.error(error.response?.data?.message || 'Analysis failed');
    } finally {
      setAnalyzing(null);
    }
  };

  const handleGenerateCoaching = async (fileId: string) => {
    if (!fileId || fileId === 'undefined') {
      toast.error('Invalid file ID');
      return;
    }

    try {
      setGeneratingCoaching(fileId);
      toast.info('Generating coaching plan...');

      // Check if transcript already exists
      let transcriptId;
      try {
        const existingTranscript = await apiService.getTranscriptByAudioFile(fileId);
        transcriptId = existingTranscript.data.id;
        console.log('Using existing transcript:', transcriptId);
      } catch (error) {
        // Transcript doesn't exist, create new one
        console.log('Creating new transcript for file:', fileId);
        const transcriptResponse = await apiService.transcribeAudio(fileId);
        transcriptId = transcriptResponse.data.id;
      }
      
      // Check if analysis already exists
      let analysisId;
      try {
        const existingAnalysis = await apiService.getAnalysisByTranscript(transcriptId);
        analysisId = existingAnalysis.data.id;
        console.log('Using existing analysis:', analysisId);
      } catch (error) {
        // Analysis doesn't exist, create new one
        console.log('Creating new analysis for transcript:', transcriptId);
        const analysisResponse = await apiService.analyzeTranscript(transcriptId);
        analysisId = analysisResponse.data.id;
      }
      
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
      
      // Finally generate coaching plan
      const coachingResponse = await apiService.generateCoachingPlan(analysisId);
      
      toast.success('Coaching plan generated!');
      
      // Navigate to coaching page
      window.location.href = `/coaching?analysisId=${analysisId}`;
      
    } catch (error: any) {
      console.error('Coaching generation error:', error);
      toast.error(error.response?.data?.message || 'Failed to generate coaching plan');
    } finally {
      setGeneratingCoaching(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'processing':
        return <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />;
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
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const filteredFiles = uploadedFiles.filter(file => {
    const matchesSearch = file.originalName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || file.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Upload Audio</h1>
        <p className="text-gray-600 mt-1">
          Upload audio files for transcription and AI analysis
        </p>
      </div>

      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Upload className="w-5 h-5 mr-2" />
            Upload Audio File
          </CardTitle>
          <CardDescription>
            Drag and drop your audio file here or click to browse
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragOver
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <FileAudio className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium text-gray-900 mb-2">
              Drop your audio file here
            </p>
            <p className="text-gray-500 mb-4">
              Supports WAV and MP3 files up to 50MB
            </p>
            
            {uploading && (
              <div className="space-y-2">
                <Progress value={uploadProgress} className="w-full" />
                <p className="text-sm text-gray-600">
                  Uploading... {uploadProgress}%
                </p>
              </div>
            )}

            {!uploading && (
              <div className="space-y-4">
                <Button
                  onClick={() => document.getElementById('file-input')?.click()}
                  disabled={uploading}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Choose File
                </Button>
                <input
                  id="file-input"
                  type="file"
                  accept="audio/*,.wav,.mp3"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <p className="text-xs text-gray-400">
                  or drag and drop your file here
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Uploaded Files ({totalItems})</CardTitle>
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
            <div className="w-full sm:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="uploaded">Uploaded</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Files List */}
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-20 bg-gray-200 rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : filteredFiles.length > 0 ? (
            <div className="space-y-4">
              {filteredFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    {getStatusIcon(file.status)}
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{file.originalName}</h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                        <span>{formatFileSize(file.size)}</span>
                        <span>•</span>
                        <span>{file.mimetype}</span>
                        {file.duration && (
                          <>
                            <span>•</span>
                            <span>{formatDuration(file.duration)}</span>
                          </>
                        )}
                        <span>•</span>
                        <span>{new Date(file.uploadedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(file.status)}>
                      {file.status}
                    </Badge>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTranscribe(file.id)}
                      disabled={transcribing === file.id}
                    >
                      {transcribing === file.id ? (
                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Play className="w-4 h-4 mr-1" />
                      )}
                      Transcribe
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAnalyze(file.id)}
                      disabled={analyzing === file.id}
                    >
                      {analyzing === file.id ? (
                        <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Brain className="w-4 h-4 mr-1" />
                      )}
                      Analyze
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleGenerateCoaching(file.id)}
                      disabled={generatingCoaching === file.id}
                    >
                      {generatingCoaching === file.id ? (
                        <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <GraduationCap className="w-4 h-4 mr-1" />
                      )}
                      Coach
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/transcripts?audioFileId=${file.id}`)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteFile(file.id)}
                      disabled={deletingFile === file.id}
                      className="text-red-600 hover:text-red-700"
                    >
                      {deletingFile === file.id ? (
                        <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FileAudio className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No files found</p>
              <p className="text-sm">Upload your first audio file to get started</p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-500">
                Showing {((currentPage - 1) * 10) + 1} to {Math.min(currentPage * 10, totalItems)} of {totalItems} files
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchUploadedFiles(currentPage - 1)}
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
                  onClick={() => fetchUploadedFiles(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How it works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-blue-600 font-bold">1</span>
              </div>
              <h3 className="font-medium">Upload Audio</h3>
              <p className="text-sm text-gray-500">
                Upload your contact center audio files
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-green-600 font-bold">2</span>
              </div>
              <h3 className="font-medium">Transcribe</h3>
              <p className="text-sm text-gray-500">
                Get accurate speech-to-text conversion
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-purple-600 font-bold">3</span>
              </div>
              <h3 className="font-medium">Analyze</h3>
              <p className="text-sm text-gray-500">
                AI-powered conversation analysis
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-orange-600 font-bold">4</span>
              </div>
              <h3 className="font-medium">Coach</h3>
              <p className="text-sm text-gray-500">
                Generate personalized coaching plans
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 