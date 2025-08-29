import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  getProductCategories, 
  getDigitalProducts, 
  purchaseDigitalProduct,
  getUserProducts,
  createDigitalProduct,
  updateDigitalProduct,
  deleteDigitalProduct
} from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from '@/components/ui/dialog';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { 
  Search, 
  Filter, 
  Plus, 
  ShoppingCart, 
  Star, 
  Eye, 
  Download,
  Edit,
  Trash2,
  Package,
  IndianRupee,
  Tag,
  Image as ImageIcon,
  FileText,
  Video,
  Music,
  Code
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ProductCategory {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
}

interface DigitalProduct {
  id: string;
  title: string;
  description: string | null;
  price_paise: number;
  category_id: string | null;
  product_type: string;
  thumbnail_url: string | null;
  preview_url: string | null;
  tags: string[] | null;
  rating: number | null;
  review_count: number;
  total_sales: number;
  seller_id: string;
  created_at: string;
  product_categories?: ProductCategory;
  profiles?: {
    display_name: string;
    avatar_url: string | null;
  };
}

const Marketplace = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  
  // State
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [products, setProducts] = useState<DigitalProduct[]>([]);
  const [userProducts, setUserProducts] = useState<DigitalProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  
  // Product management
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<DigitalProduct | null>(null);
  const [productForm, setProductForm] = useState({
    title: '',
    description: '',
    price_paise: '',
    category_id: '',
    product_type: 'single',
    thumbnail_url: '',
    preview_url: '',
    tags: '',
  });

  useEffect(() => {
    fetchCategories();
    fetchProducts();
    if (profile?.is_helper) {
      fetchUserProducts();
    }
  }, []);

  const fetchCategories = async () => {
    try {
      const data = await getProductCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const filters: any = {};
      if (selectedCategory) filters.category_id = selectedCategory;
      if (searchQuery) filters.search = searchQuery;
      if (priceRange.min) filters.min_price = parseInt(priceRange.min) * 100;
      if (priceRange.max) filters.max_price = parseInt(priceRange.max) * 100;
      
      const data = await getDigitalProducts(filters);
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch products',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProducts = async () => {
    if (!user) return;
    try {
      const data = await getUserProducts(user.id);
      setUserProducts(data);
    } catch (error) {
      console.error('Error fetching user products:', error);
    }
  };

  const handleSearch = () => {
    fetchProducts();
  };

  const handlePurchase = async (product: DigitalProduct) => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to purchase products',
        variant: 'destructive',
      });
      return;
    }

    try {
      await purchaseDigitalProduct(product.id);
      toast({
        title: 'Purchase Successful!',
        description: 'Product has been added to your library',
      });
      // Refresh products to update sales count
      fetchProducts();
    } catch (error: any) {
      toast({
        title: 'Purchase Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleProductSubmit = async () => {
    if (!user) return;

    try {
      const productData = {
        title: productForm.title,
        description: productForm.description,
        price_paise: parseInt(productForm.price_paise) * 100,
        category_id: productForm.category_id || null,
        product_type: productForm.product_type,
        thumbnail_url: productForm.thumbnail_url || null,
        preview_url: productForm.preview_url || null,
        tags: productForm.tags ? productForm.tags.split(',').map(t => t.trim()) : null,
      };

      if (editingProduct) {
        await updateDigitalProduct(editingProduct.id, productData);
        toast({
          title: 'Product Updated',
          description: 'Your product has been updated successfully',
        });
      } else {
        await createDigitalProduct(productData);
        toast({
          title: 'Product Created',
          description: 'Your product has been listed successfully',
        });
      }

      setIsProductDialogOpen(false);
      setEditingProduct(null);
      resetProductForm();
      fetchUserProducts();
      fetchProducts();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleEditProduct = (product: DigitalProduct) => {
    setEditingProduct(product);
    setProductForm({
      title: product.title,
      description: product.description || '',
      price_paise: (product.price_paise / 100).toString(),
      category_id: product.category_id || '',
      product_type: product.product_type,
      thumbnail_url: product.thumbnail_url || '',
      preview_url: product.preview_url || '',
      tags: product.tags?.join(', ') || '',
    });
    setIsProductDialogOpen(true);
  };

  const handleDeleteProduct = async (productId: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteDigitalProduct(productId);
        toast({
          title: 'Product Deleted',
          description: 'Product has been removed from marketplace',
        });
        fetchUserProducts();
        fetchProducts();
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
      }
    }
  };

  const resetProductForm = () => {
    setProductForm({
      title: '',
      description: '',
      price_paise: '',
      category_id: '',
      product_type: 'single',
      thumbnail_url: '',
      preview_url: '',
      tags: '',
    });
  };

  const getProductTypeIcon = (type: string) => {
    switch (type) {
      case 'single': return <Package className="w-4 h-4" />;
      case 'pack': return <Package className="w-4 h-4" />;
      case 'subscription': return <Package className="w-4 h-4" />;
      default: return <Package className="w-4 h-4" />;
    }
  };

  const getCategoryIcon = (categoryName: string) => {
    switch (categoryName) {
      case 'Digital Art': return <ImageIcon className="w-4 h-4" />;
      case 'Photography': return <ImageIcon className="w-4 h-4" />;
      case 'Video Content': return <Video className="w-4 h-4" />;
      case 'Templates': return <FileText className="w-4 h-4" />;
      case 'Documents': return <FileText className="w-4 h-4" />;
      case 'Audio': return <Music className="w-4 h-4" />;
      case 'Software': return <Code className="w-4 h-4" />;
      default: return <Package className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Digital Marketplace
          </h1>
          <p className="text-muted-foreground">
            Discover and purchase digital products from talented professionals
          </p>
        </div>
        {profile?.is_helper && (
          <Button 
            onClick={() => {
              setEditingProduct(null);
              resetProductForm();
              setIsProductDialogOpen(true);
            }}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            List Product
          </Button>
        )}
      </div>

      {/* Search and Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10"
            />
          </div>
          
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger>
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.icon} {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            placeholder="Min Price (₹)"
            type="number"
            value={priceRange.min}
            onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
            className="w-full"
          />

          <Input
            placeholder="Max Price (₹)"
            type="number"
            value={priceRange.max}
            onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
            className="w-full"
          />
        </div>
        
        <div className="flex justify-between items-center mt-4">
          <Button onClick={handleSearch} className="bg-gradient-to-r from-purple-600 to-blue-600">
            <Filter className="w-4 h-4 mr-2" />
            Apply Filters
          </Button>
          <span className="text-sm text-muted-foreground">
            {products.length} products found
          </span>
        </div>
      </Card>

      {/* Main Content */}
      <Tabs defaultValue="browse" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="browse">Browse Products</TabsTrigger>
          {profile?.is_helper && (
            <TabsTrigger value="my-products">My Products</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="browse" className="space-y-6">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <div className="h-48 bg-muted rounded-t-lg" />
                  <CardContent className="p-4 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                    <div className="h-6 bg-muted rounded w-1/4" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <Card key={product.id} className="group hover:shadow-lg transition-all duration-300 overflow-hidden">
                  <div className="relative">
                    {product.thumbnail_url ? (
                      <img
                        src={product.thumbnail_url}
                        alt={product.title}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
                        <Package className="w-16 h-16 text-muted-foreground" />
                      </div>
                    )}
                    
                    <div className="absolute top-2 left-2">
                      <Badge variant="secondary" className="bg-white/90 text-black">
                        {getCategoryIcon(product.product_categories?.name || '')}
                        {product.product_categories?.name || 'Other'}
                      </Badge>
                    </div>
                    
                    <div className="absolute top-2 right-2">
                      <Badge variant="secondary" className="bg-white/90 text-black">
                        {getProductTypeIcon(product.product_type)}
                        {product.product_type}
                      </Badge>
                    </div>
                  </div>

                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-purple-600 transition-colors">
                        {product.title}
                      </h3>
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {product.description || 'No description available'}
                    </p>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Avatar className="w-6 h-6">
                        <AvatarImage src={product.profiles?.avatar_url || undefined} />
                        <AvatarFallback className="text-xs">
                          {product.profiles?.display_name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <span>{product.profiles?.display_name || 'Unknown Seller'}</span>
                    </div>

                    {product.tags && product.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {product.tags.slice(0, 3).map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            <Tag className="w-3 h-3 mr-1" />
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {product.rating && (
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-medium">{product.rating}</span>
                            <span className="text-xs text-muted-foreground">({product.review_count})</span>
                          </div>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {product.total_sales} sales
                        </span>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-2xl font-bold text-purple-600">
                          ₹{(product.price_paise / 100).toFixed(0)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {product.product_type === 'subscription' ? 'per month' : 'one-time'}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        onClick={() => handlePurchase(product)}
                        className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                      >
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Buy Now
                      </Button>
                      
                      {product.preview_url && (
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-2" />
                          Preview
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {profile?.is_helper && (
          <TabsContent value="my-products" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userProducts.map((product) => (
                <Card key={product.id} className="group hover:shadow-lg transition-all duration-300">
                  <div className="relative">
                    {product.thumbnail_url ? (
                      <img
                        src={product.thumbnail_url}
                        alt={product.title}
                        className="w-full h-48 object-cover"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
                        <Package className="w-16 h-16 text-muted-foreground" />
                      </div>
                    )}
                    
                    <div className="absolute top-2 right-2 flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleEditProduct(product)}
                        className="bg-white/90 hover:bg-white"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteProduct(product.id)}
                        className="bg-white/90 hover:bg-red-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <CardContent className="p-4 space-y-3">
                    <h3 className="font-semibold text-lg">{product.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {product.description || 'No description'}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="text-2xl font-bold text-purple-600">
                        ₹{(product.price_paise / 100).toFixed(0)}
                      </div>
                      <Badge variant={product.is_active ? 'default' : 'secondary'}>
                        {product.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{product.total_sales} sales</span>
                      <span>₹{(product.total_revenue_paise / 100).toFixed(0)} earned</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        )}
      </Tabs>

      {/* Product Dialog */}
      <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? 'Edit Product' : 'List New Product'}
            </DialogTitle>
            <DialogDescription>
              {editingProduct ? 'Update your product information' : 'Create a new digital product listing'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Product Title *</Label>
              <Input
                id="title"
                value={productForm.title}
                onChange={(e) => setProductForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter product title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Price (₹) *</Label>
              <Input
                id="price"
                type="number"
                value={productForm.price_paise}
                onChange={(e) => setProductForm(prev => ({ ...prev, price_paise: e.target.value }))}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={productForm.category_id} onValueChange={(value) => setProductForm(prev => ({ ...prev, category_id: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.icon} {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Product Type *</Label>
              <Select value={productForm.product_type} onValueChange={(value) => setProductForm(prev => ({ ...prev, product_type: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Single Item</SelectItem>
                  <SelectItem value="pack">Product Pack</SelectItem>
                  <SelectItem value="subscription">Subscription</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={productForm.description}
                onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe your product..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="thumbnail">Thumbnail URL</Label>
              <Input
                id="thumbnail"
                value={productForm.thumbnail_url}
                onChange={(e) => setProductForm(prev => ({ ...prev, thumbnail_url: e.target.value }))}
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="preview">Preview URL</Label>
              <Input
                id="preview"
                value={productForm.preview_url}
                onChange={(e) => setProductForm(prev => ({ ...prev, preview_url: e.target.value }))}
                placeholder="https://example.com/preview"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                value={productForm.tags}
                onChange={(e) => setProductForm(prev => ({ ...prev, tags: e.target.value }))}
                placeholder="digital art, illustration, modern"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsProductDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleProductSubmit} className="bg-gradient-to-r from-purple-600 to-blue-600">
              {editingProduct ? 'Update Product' : 'List Product'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Marketplace;
