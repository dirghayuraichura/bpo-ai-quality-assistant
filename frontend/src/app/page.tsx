'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, 
  FileText, 
  Brain, 
  GraduationCap, 
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import Link from 'next/link';
import { apiService } from '@/lib/api';
import { toast } from 'sonner';

interface DashboardStats {
  uploads: number;
  transcripts: number;
  analyses: number;
  coachingPlans: number;
  recentActivity: Array<{
    id: string;
    type: 'upload' | 'transcript' | 'analysis' | 'coaching';
    title: string;
    status: string;
    timestamp: string;
  }>;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    uploads: 0,
    transcripts: 0,
    analyses: 0,
    coachingPlans: 0,
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch data from all endpoints
        const [uploads, transcripts, analyses, coachingPlans] = await Promise.all([
          apiService.getUploads(1, 1),
          apiService.getTranscripts(1, 1),
          apiService.getAnalyses(1, 1),
          apiService.getCoachingPlans(1, 1)
        ]);

        setStats({
          uploads: uploads.pagination.totalItems,
          transcripts: transcripts.pagination.totalItems,
          analyses: analyses.pagination.totalItems,
          coachingPlans: coachingPlans.pagination.totalItems,
          recentActivity: [
            // Mock recent activity - in real app, you'd fetch this from a dedicated endpoint
            {
              id: '1',
              type: 'upload',
              title: 'customer_call_001.wav',
              status: 'completed',
              timestamp: new Date().toISOString()
            }
          ]
        });
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Overview of your contact center AI analysis
          </p>
        </div>
        <Link href="/upload">
          <Button>
            <Upload className="w-4 h-4 mr-2" />
            Upload Audio
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Audio Files</CardTitle>
            <Upload className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.uploads}</div>
            <p className="text-xs text-muted-foreground">
              Total uploaded files
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transcripts</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.transcripts}</div>
            <p className="text-xs text-muted-foreground">
              Processed transcripts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Analyses</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.analyses}</div>
            <p className="text-xs text-muted-foreground">
              AI analyses completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Coaching Plans</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.coachingPlans}</div>
            <p className="text-xs text-muted-foreground">
              Generated plans
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Upload className="w-5 h-5 mr-2" />
              Upload Audio
            </CardTitle>
            <CardDescription>
              Upload audio files for transcription and analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/upload">
              <Button className="w-full">
                Start Upload
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Brain className="w-5 h-5 mr-2" />
              View Analysis
            </CardTitle>
            <CardDescription>
              Review AI-powered conversation analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/analysis">
              <Button variant="outline" className="w-full">
                View Analyses
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <GraduationCap className="w-5 h-5 mr-2" />
              Coaching Plans
            </CardTitle>
            <CardDescription>
              Access personalized coaching recommendations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/coaching">
              <Button variant="outline" className="w-full">
                View Plans
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            Recent Activity
          </CardTitle>
          <CardDescription>
            Latest uploads and processing activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.recentActivity.length > 0 ? (
              stats.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(activity.status)}
                    <div>
                      <p className="font-medium text-sm">{activity.title}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(activity.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Badge className={getStatusColor(activity.status)}>
                    {activity.status}
                  </Badge>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Upload className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No recent activity</p>
                <p className="text-sm">Upload your first audio file to get started</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
