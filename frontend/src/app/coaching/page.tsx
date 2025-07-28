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
  GraduationCap, 
  Target, 
  TrendingUp, 
  TrendingDown,
  Star,
  Eye,
  Trash2,
  Search,
  Download
} from 'lucide-react';
import { apiService, CoachingPlan } from '@/lib/api';
import { toast } from 'sonner';

export default function CoachingPage() {
  const searchParams = useSearchParams();
  const analysisId = searchParams.get('analysisId');
  
  const [coachingPlans, setCoachingPlans] = useState<CoachingPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<CoachingPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingPlan, setGeneratingPlan] = useState<string | null>(null);
  const [deletingPlan, setDeletingPlan] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [performanceFilter, setPerformanceFilter] = useState<string>('all');

  useEffect(() => {
    fetchCoachingPlans();
  }, []);

  const fetchCoachingPlans = async (page = 1) => {
    try {
      setLoading(true);
      const response = await apiService.getCoachingPlans(page, 10);
      setCoachingPlans(response.data);
      setTotalPages(response.pagination.total);
      setTotalItems(response.pagination.totalItems);
      setCurrentPage(response.pagination.current);
      
      if (analysisId) {
        const plan = response.data.find(p => p.analysisId === analysisId);
        if (plan) {
          setSelectedPlan(plan);
        }
      }
    } catch (error) {
      console.error('Failed to fetch coaching plans:', error);
      toast.error('Failed to load coaching plans');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCoachingPlan = async (analysisId: string) => {
    if (!analysisId || analysisId === 'undefined') {
      toast.error('Invalid analysis ID');
      return;
    }

    try {
      setGeneratingPlan(analysisId);
      toast.info('Generating coaching plan...');

      // Check if coaching plan already exists
      try {
        const existingPlan = await apiService.getCoachingPlanByAnalysis(analysisId);
        toast.success('Coaching plan already exists!');
        setSelectedPlan(existingPlan.data);
        return;
      } catch (error) {
        // Coaching plan doesn't exist, create new one
        console.log('Creating new coaching plan for analysis:', analysisId);
      }

      const response = await apiService.generateCoachingPlan(analysisId);
      
      toast.success('Coaching plan generated!');
      
      await fetchCoachingPlans();
      
      // Auto-navigate to the generated plan
      if (response.data) {
        setSelectedPlan(response.data);
      }
      
    } catch (error: any) {
      console.error('Coaching generation error:', error);
      toast.error(error.response?.data?.message || 'Failed to generate coaching plan');
    } finally {
      setGeneratingPlan(null);
    }
  };

  const handleDeleteCoachingPlan = async (planId: string) => {
    if (!planId || planId === 'undefined') {
      toast.error('Invalid coaching plan ID');
      return;
    }

    try {
      setDeletingPlan(planId);
      await apiService.deleteCoachingPlan(planId);
      toast.success('Coaching plan deleted successfully!');
      await fetchCoachingPlans(currentPage);
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error(error.response?.data?.message || 'Failed to delete coaching plan');
    } finally {
      setDeletingPlan(null);
    }
  };

  const getPerformanceColor = (level: string) => {
    switch (level) {
      case 'excellent':
        return 'bg-green-100 text-green-800';
      case 'good':
        return 'bg-blue-100 text-blue-800';
      case 'average':
        return 'bg-yellow-100 text-yellow-800';
      case 'needs_improvement':
        return 'bg-orange-100 text-orange-800';
      case 'poor':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredPlans = coachingPlans.filter(plan => {
    const matchesSearch = plan.analysis?.audioFile?.originalName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         plan.customNotes?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPerformance = performanceFilter === 'all' || plan.overallPerformance.level === performanceFilter;
    
    return matchesSearch && matchesPerformance;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Coaching Plans</h1>
          <p className="text-gray-600 mt-1">
            Personalized coaching recommendations and training plans
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
        <h1 className="text-3xl font-bold text-gray-900">Coaching Plans</h1>
        <p className="text-gray-600 mt-1">
          Personalized coaching recommendations and training plans
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coaching Plans ({totalItems})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search coaching plans..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full sm:w-48">
              <Select value={performanceFilter} onValueChange={setPerformanceFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Performance Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="excellent">Excellent</SelectItem>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="average">Average</SelectItem>
                  <SelectItem value="needs_improvement">Needs Improvement</SelectItem>
                  <SelectItem value="poor">Poor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {filteredPlans.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPlans.map((plan) => (
                <Card 
                  key={plan.id} 
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setSelectedPlan(plan)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center">
                        <GraduationCap className="w-5 h-5 mr-2 text-blue-600" />
                        Coaching Plan
                      </CardTitle>
                      <Badge className={getPerformanceColor(plan.overallPerformance.level)}>
                        {plan.overallPerformance.level.replace('_', ' ')}
                      </Badge>
                    </div>
                    <CardDescription>
                      {new Date(plan.generatedAt).toLocaleDateString()} • Agent {plan.agentId}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Performance:</span>
                      <span className="text-sm font-medium">
                        {plan.overallPerformance.score}/10
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Strengths:</span>
                      <span className="text-sm font-medium">
                        {plan.strengths.length} areas
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Improvements:</span>
                      <span className="text-sm font-medium">
                        {plan.improvementAreas.length} areas
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Action Items:</span>
                      <span className="text-sm font-medium">
                        {plan.actionItems.length} tasks
                      </span>
                    </div>

                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPlan(plan);
                        }}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCoachingPlan(plan.id);
                        }}
                        disabled={deletingPlan === plan.id}
                        className="text-red-600 hover:text-red-700"
                      >
                        {deletingPlan === plan.id ? (
                          <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <GraduationCap className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>No coaching plans found</p>
              <p className="text-sm">Analyze a transcript to generate coaching plans</p>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-500">
                Showing {((currentPage - 1) * 10) + 1} to {Math.min(currentPage * 10, totalItems)} of {totalItems} plans
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchCoachingPlans(currentPage - 1)}
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
                  onClick={() => fetchCoachingPlans(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-6xl max-h-[90vh] overflow-hidden">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <GraduationCap className="w-5 h-5 mr-2" />
                  Coaching Plan Details
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedPlan(null)}
                >
                  ×
                </Button>
              </div>
              <CardDescription>
                Agent {selectedPlan.agentId} • {new Date(selectedPlan.generatedAt).toLocaleString()}
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-y-auto max-h-96">
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="strengths">Strengths</TabsTrigger>
                  <TabsTrigger value="improvements">Improvements</TabsTrigger>
                  <TabsTrigger value="actions">Actions</TabsTrigger>
                  <TabsTrigger value="training">Training</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Performance Score</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{selectedPlan.overallPerformance.score}/10</div>
                        <Badge className={getPerformanceColor(selectedPlan.overallPerformance.level)}>
                          {selectedPlan.overallPerformance.level.replace('_', ' ')}
                        </Badge>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Strengths</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{selectedPlan.strengths.length}</div>
                        <p className="text-xs text-gray-500">Identified areas</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Improvement Areas</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{selectedPlan.improvementAreas.length}</div>
                        <p className="text-xs text-gray-500">Areas to focus on</p>
                      </CardContent>
                    </Card>
                  </div>

                  {selectedPlan.customNotes && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Custom Notes</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-700">{selectedPlan.customNotes}</p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="strengths" className="space-y-4">
                  <div className="space-y-4">
                    {selectedPlan.strengths.map((strength, index) => (
                      <Card key={index}>
                        <CardHeader>
                          <CardTitle className="text-lg">{strength.area}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-gray-700 mb-3">{strength.description}</p>
                          {strength.examples.length > 0 && (
                            <div>
                              <p className="text-sm font-medium mb-2">Examples:</p>
                              <ul className="text-sm text-gray-600 space-y-1">
                                {strength.examples.map((example, i) => (
                                  <li key={i}>• {example}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="improvements" className="space-y-4">
                  <div className="space-y-4">
                    {selectedPlan.improvementAreas.map((area, index) => (
                      <Card key={index}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">{area.area}</CardTitle>
                            <Badge className={getPriorityColor(area.priority)}>
                              {area.priority}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-gray-700 mb-3">{area.description}</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm font-medium mb-1">Current Performance:</p>
                              <p className="text-sm text-gray-600">{area.currentPerformance}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium mb-1">Target Performance:</p>
                              <p className="text-sm text-gray-600">{area.targetPerformance}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="actions" className="space-y-4">
                  <div className="space-y-4">
                    {selectedPlan.actionItems.map((item, index) => (
                      <Card key={index}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">{item.title}</CardTitle>
                            <Badge className={getPriorityColor(item.priority)}>
                              {item.priority}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-gray-700 mb-3">{item.description}</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm font-medium mb-1">Category:</p>
                              <Badge variant="outline">{item.category.replace('_', ' ')}</Badge>
                            </div>
                            {item.estimatedTime && (
                              <div>
                                <p className="text-sm font-medium mb-1">Estimated Time:</p>
                                <p className="text-sm text-gray-600">{item.estimatedTime}</p>
                              </div>
                            )}
                          </div>
                          {item.resources && item.resources.length > 0 && (
                            <div className="mt-3">
                              <p className="text-sm font-medium mb-2">Resources:</p>
                              <ul className="text-sm text-gray-600 space-y-1">
                                {item.resources.map((resource, i) => (
                                  <li key={i}>• {resource}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="training" className="space-y-4">
                  <div className="space-y-4">
                    {selectedPlan.trainingRecommendations.map((training, index) => (
                      <Card key={index}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">{training.title}</CardTitle>
                            <Badge className={getPriorityColor(training.priority)}>
                              {training.priority}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-gray-700 mb-3">{training.description}</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm font-medium mb-1">Type:</p>
                              <Badge variant="outline">{training.type}</Badge>
                            </div>
                            <div>
                              <p className="text-sm font-medium mb-1">Duration:</p>
                              <p className="text-sm text-gray-600">{training.duration}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
            <div className="p-6 border-t">
              <div className="flex space-x-2">
                <Button
                  onClick={() => {
                    const planData = JSON.stringify(selectedPlan, null, 2);
                    const blob = new Blob([planData], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `coaching-plan-${selectedPlan.agentId}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setSelectedPlan(null)}
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