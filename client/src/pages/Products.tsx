
import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Package,
  Star,
  TrendingUp,
  ShoppingCart,
  Barcode,
  Tag,
  Building2,
  FolderPlus,
  ImagePlus,
  X,
  Upload,
  Globe,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { Product, InsertProduct, Category, Manufacturer, ProductGroup, InsertCategory, InsertManufacturer } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

const productFormSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
  sku: z.string().min(1, "SKU é obrigatório"),
  barcode: z.string().optional(),
  price: z.string().min(1, "Preço é obrigatório"),
  costPrice: z.string().optional(),
  categoryId: z.number().optional(),
  manufacturerId: z.number().optional(),
  productGroupId: z.number().optional(),
  weight: z.string().optional(),
  stock: z.number().min(0, "Estoque deve ser positivo").default(0),
  minStock: z.number().min(0, "Estoque mínimo deve ser positivo").default(0),
  maxStock: z.number().optional(),
  status: z.enum(["active", "inactive", "discontinued"]).default("active"),
  featured: z.boolean().default(false),
  images: z.array(z.string()).default([]),
  defaultImageIndex: z.number().default(0),
  tags: z.array(z.string()).default([]),
});

const categoryFormSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
  parentId: z.number().optional(),
  status: z.enum(["active", "inactive"]).default("active"),
  image: z.string().optional(),
});

const manufacturerFormSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
  website: z.string().url().optional().or(z.string().length(0)),
  email: z.string().email().optional().or(z.string().length(0)),
  phone: z.string().optional(),
  image: z.string().optional(),
  status: z.enum(["active", "inactive"]).default("active"),
});

type ProductFormData = z.infer<typeof productFormSchema>;
type CategoryFormData = z.infer<typeof categoryFormSchema>;
type ManufacturerFormData = z.infer<typeof manufacturerFormSchema>;

// Componente para upload com drag & drop
const DragDropUpload = ({ 
  onFileSelect, 
  multiple = false, 
  className = "" 
}: { 
  onFileSelect: (files: FileList) => void;
  multiple?: boolean;
  className?: string;
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      onFileSelect(files);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files);
    }
  };

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
        isDragging 
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
          : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
      } ${className}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex flex-col items-center space-y-2">
        <Upload className="w-8 h-8 text-gray-400" />
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Arraste e solte {multiple ? 'imagens' : 'uma imagem'} aqui ou
        </p>
        <label className="cursor-pointer">
          <span className="text-blue-600 hover:text-blue-700 text-sm font-medium">
            clique para selecionar
          </span>
          <input
            type="file"
            className="hidden"
            accept="image/*"
            multiple={multiple}
            onChange={handleFileInput}
          />
        </label>
      </div>
    </div>
  );
};

export default function Products() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive" | "discontinued">("all");
  const [categoryFilter, setCategoryFilter] = useState<"all" | string>("all");
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [isManufacturerDialogOpen, setIsManufacturerDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingManufacturer, setEditingManufacturer] = useState<Manufacturer | null>(null);
  const [productImages, setProductImages] = useState<string[]>([]);
  const [categoryImage, setCategoryImage] = useState<string>("");
  const [manufacturerImage, setManufacturerImage] = useState<string>("");
  const [displayedProducts, setDisplayedProducts] = useState<Product[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [activeTab, setActiveTab] = useState("products");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const PRODUCTS_PER_PAGE = 9;

  // Fetch products
  const { data: products = [], isLoading: isLoadingProducts } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    refetchOnWindowFocus: false,
  });

  const { data: categories = [], isLoading: isLoadingCategories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: manufacturers = [], isLoading: isLoadingManufacturers } = useQuery<Manufacturer[]>({
    queryKey: ["/api/manufacturers"],
  });

  const { data: productGroups = [] } = useQuery<ProductGroup[]>({
    queryKey: ["/api/product-groups"],
  });

  // Forms
  const productForm = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      description: "",
      sku: "",
      barcode: "",
      price: "",
      costPrice: "",
      categoryId: undefined,
      manufacturerId: undefined,
      productGroupId: undefined,
      weight: "",
      stock: 0,
      minStock: 0,
      maxStock: undefined,
      status: "active",
      featured: false,
      images: [],
      defaultImageIndex: 0,
      tags: [],
    }
  });

  const categoryForm = useForm<CategoryFormData>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: "",
      description: "",
      status: "active",
      image: "",
    }
  });

  const manufacturerForm = useForm<ManufacturerFormData>({
    resolver: zodResolver(manufacturerFormSchema),
    defaultValues: {
      name: "",
      description: "",
      website: "",
      email: "",
      phone: "",
      status: "active",
      image: "",
    }
  });

  // Product mutations
  const createProductMutation = useMutation({
    mutationFn: (data: InsertProduct) => apiRequest("POST", "/api/products", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setIsProductDialogOpen(false);
      setEditingProduct(null);
      productForm.reset();
      setProductImages([]);
      toast({
        title: "Produto criado",
        description: "Produto foi criado com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao criar produto.",
        variant: "destructive",
      });
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<InsertProduct> }) =>
      apiRequest("PUT", `/api/products/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setIsProductDialogOpen(false);
      setEditingProduct(null);
      productForm.reset();
      setProductImages([]);
      toast({
        title: "Produto atualizado",
        description: "Produto foi atualizado com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao atualizar produto.",
        variant: "destructive",
      });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Produto excluído",
        description: "Produto foi excluído com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao excluir produto.",
        variant: "destructive",
      });
    },
  });

  // Category mutations
  const createCategoryMutation = useMutation({
    mutationFn: (data: InsertCategory) => apiRequest("POST", "/api/categories", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setIsCategoryDialogOpen(false);
      setEditingCategory(null);
      categoryForm.reset();
      setCategoryImage("");
      toast({
        title: "Categoria criada",
        description: "Categoria foi criada com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao criar categoria.",
        variant: "destructive",
      });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<InsertCategory> }) =>
      apiRequest("PUT", `/api/categories/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setIsCategoryDialogOpen(false);
      setEditingCategory(null);
      categoryForm.reset();
      setCategoryImage("");
      toast({
        title: "Categoria atualizada",
        description: "Categoria foi atualizada com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao atualizar categoria.",
        variant: "destructive",
      });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/categories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({
        title: "Categoria excluída",
        description: "Categoria foi excluída com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao excluir categoria.",
        variant: "destructive",
      });
    },
  });

  // Manufacturer mutations
  const createManufacturerMutation = useMutation({
    mutationFn: (data: InsertManufacturer) => apiRequest("POST", "/api/manufacturers", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/manufacturers"] });
      setIsManufacturerDialogOpen(false);
      setEditingManufacturer(null);
      manufacturerForm.reset();
      setManufacturerImage("");
      toast({
        title: "Fabricante criado",
        description: "Fabricante foi criado com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao criar fabricante.",
        variant: "destructive",
      });
    },
  });

  const updateManufacturerMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<InsertManufacturer> }) =>
      apiRequest("PUT", `/api/manufacturers/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/manufacturers"] });
      setIsManufacturerDialogOpen(false);
      setEditingManufacturer(null);
      manufacturerForm.reset();
      setManufacturerImage("");
      toast({
        title: "Fabricante atualizado",
        description: "Fabricante foi atualizado com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao atualizar fabricante.",
        variant: "destructive",
      });
    },
  });

  const deleteManufacturerMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/manufacturers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/manufacturers"] });
      toast({
        title: "Fabricante excluído",
        description: "Fabricante foi excluído com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao excluir fabricante.",
        variant: "destructive",
      });
    },
  });

  // Upload function
  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch('/api/upload/product-image', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('sessionToken')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      return result.url;
    } catch (error) {
      console.error('Image upload error:', error);
      throw error;
    }
  };

  // Category image upload function
  const uploadCategoryImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch('/api/upload/category-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      return result.url;
    } catch (error) {
      console.error('Category image upload error:', error);
      throw error;
    }
  };

  // Manufacturer image upload function
  const uploadManufacturerImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch('/api/upload/manufacturer-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      return result.url;
    } catch (error) {
      console.error('Manufacturer image upload error:', error);
      throw error;
    }
  };

  // Upload handlers
  const handleProductImageUpload = async (files: FileList) => {
    try {
      const uploadPromises = Array.from(files).map(file => uploadImage(file));
      const imageUrls = await Promise.all(uploadPromises);
      setProductImages(prev => [...prev, ...imageUrls]);
      toast({
        title: "Imagens carregadas",
        description: `${imageUrls.length} imagem(s) carregada(s) com sucesso.`,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao carregar imagens.",
        variant: "destructive",
      });
    }
  };

  const handleCategoryImageUpload = async (files: FileList) => {
    try {
      const imageUrl = await uploadCategoryImage(files[0]);
      setCategoryImage(imageUrl);
      toast({
        title: "Imagem carregada",
        description: "Imagem da categoria carregada com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao carregar imagem.",
        variant: "destructive",
      });
    }
  };

  const handleManufacturerImageUpload = async (files: FileList) => {
    try {
      const imageUrl = await uploadManufacturerImage(files[0]);
      setManufacturerImage(imageUrl);
      toast({
        title: "Imagem carregada",
        description: "Imagem do fabricante carregada com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao carregar imagem.",
        variant: "destructive",
      });
    }
  };

  // Product handlers
  const onSubmitProduct = (data: ProductFormData) => {
    const productData = {
      ...data,
      categoryId: data.categoryId || null,
      manufacturerId: data.manufacturerId || null,
      productGroupId: data.productGroupId || null,
      images: productImages,
    };

    if (editingProduct) {
      updateProductMutation.mutate({ id: editingProduct.id, data: productData });
    } else {
      createProductMutation.mutate(productData);
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setProductImages(product.images || []);
    productForm.reset({
      name: product.name,
      description: product.description || "",
      sku: product.sku,
      barcode: product.barcode || "",
      price: product.price,
      costPrice: product.costPrice || "",
      categoryId: product.categoryId || undefined,
      manufacturerId: product.manufacturerId || undefined,
      productGroupId: product.productGroupId || undefined,
      weight: product.weight || "",
      stock: product.stock,
      minStock: product.minStock || 0,
      maxStock: product.maxStock || undefined,
      status: product.status as "active" | "inactive" | "discontinued",
      featured: product.featured || false,
      images: product.images || [],
      tags: product.tags || [],
    });
    setIsProductDialogOpen(true);
  };

  const handleDeleteProduct = (id: number) => {
    deleteProductMutation.mutate(id);
  };

  const handleNewProduct = () => {
    setEditingProduct(null);
    setProductImages([]);
    productForm.reset();
    setIsProductDialogOpen(true);
  };

  // Category handlers
  const handleCategorySubmit = (data: CategoryFormData) => {
    const categoryData = {
      ...data,
      image: categoryImage || undefined,
    };
    
    if (editingCategory) {
      updateCategoryMutation.mutate({ id: editingCategory.id, data: categoryData });
    } else {
      createCategoryMutation.mutate(categoryData);
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setCategoryImage(category.image || "");
    categoryForm.reset({
      name: category.name,
      description: category.description || "",
      parentId: category.parentId || undefined,
      status: category.status as "active" | "inactive",
      image: category.image || "",
    });
    setIsCategoryDialogOpen(true);
  };

  const handleDeleteCategory = (id: number) => {
    deleteCategoryMutation.mutate(id);
  };

  const handleNewCategory = () => {
    setEditingCategory(null);
    setCategoryImage("");
    categoryForm.reset();
    setIsCategoryDialogOpen(true);
  };

  // Manufacturer handlers
  const handleManufacturerSubmit = (data: ManufacturerFormData) => {
    const manufacturerData = {
      ...data,
      image: manufacturerImage || null,
      website: data.website || null,
      email: data.email || null,
      phone: data.phone || null,
    };
    
    if (editingManufacturer) {
      updateManufacturerMutation.mutate({ id: editingManufacturer.id, data: manufacturerData });
    } else {
      createManufacturerMutation.mutate(manufacturerData);
    }
  };

  const handleEditManufacturer = (manufacturer: Manufacturer) => {
    setEditingManufacturer(manufacturer);
    setManufacturerImage(manufacturer.image || "");
    manufacturerForm.reset({
      name: manufacturer.name,
      description: manufacturer.description || "",
      website: manufacturer.website || "",
      email: manufacturer.email || "",
      phone: manufacturer.phone || "",
      image: manufacturer.image || "",
      status: manufacturer.status as "active" | "inactive",
    });
    setIsManufacturerDialogOpen(true);
  };

  const handleDeleteManufacturer = (id: number) => {
    deleteManufacturerMutation.mutate(id);
  };

  const handleNewManufacturer = () => {
    setEditingManufacturer(null);
    setManufacturerImage("");
    manufacturerForm.reset();
    setIsManufacturerDialogOpen(true);
  };

  const removeProductImage = (index: number) => {
    setProductImages(prev => prev.filter((_, i) => i !== index));
  };

  const getCategoryName = (categoryId: number | null) => {
    if (!categoryId) return "Sem categoria";
    const category = categories.find(c => c.id === categoryId);
    return category?.name || "Categoria não encontrada";
  };

  const getManufacturerName = (manufacturerId: number | null) => {
    if (!manufacturerId) return "Sem fabricante";
    const manufacturer = manufacturers.find(m => m.id === manufacturerId);
    return manufacturer?.name || "Fabricante não encontrado";
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || product.status === statusFilter;
    const matchesCategory = categoryFilter === "all" || product.categoryId?.toString() === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Scroll infinito com paginação
  useEffect(() => {
    const productsToShow = filteredProducts.slice(0, currentPage * PRODUCTS_PER_PAGE);
    setDisplayedProducts(productsToShow);
  }, [filteredProducts, currentPage, PRODUCTS_PER_PAGE]);

  // Reset para página 1 quando filtros mudarem
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, categoryFilter]);

  // Função para detectar scroll próximo ao final
  const handleScroll = useCallback(() => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight;
    const clientHeight = document.documentElement.clientHeight;

    // Se chegou perto do final (200px antes do fim)
    if (scrollTop + clientHeight >= scrollHeight - 200) {
      const hasMoreProducts = displayedProducts.length < filteredProducts.length;

      if (hasMoreProducts && !isLoadingMore) {
        setIsLoadingMore(true);
        // Simula delay de carregamento para melhor UX
        setTimeout(() => {
          setCurrentPage(prev => prev + 1);
          setIsLoadingMore(false);
        }, 500);
      }
    }
  }, [displayedProducts.length, filteredProducts.length, isLoadingMore]);

  // Adiciona e remove listener de scroll
  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return (
    <div className="w-full">
      {/* Page Header */}
      <div className="mb-6 md:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Produtos
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Gerencie seu catálogo de produtos, categorias e fabricantes.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="products" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Produtos
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <FolderPlus className="w-4 h-4" />
            Categorias
          </TabsTrigger>
          <TabsTrigger value="manufacturers" className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Fabricantes
          </TabsTrigger>
        </TabsList>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar produtos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                />
              </div>
              <Select value={statusFilter} onValueChange={(value: "all" | "active" | "inactive" | "discontinued") => setStatusFilter(value)}>
                <SelectTrigger className="w-[180px] bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="inactive">Inativos</SelectItem>
                  <SelectItem value="discontinued">Descontinuados</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px] bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                  <SelectValue placeholder="Filtrar por categoria" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                  <SelectItem value="all">Todas</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleNewProduct} className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Novo Produto
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] bg-white dark:bg-gray-800 max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-gray-900 dark:text-white">
                    {editingProduct ? "Editar Produto" : "Novo Produto"}
                  </DialogTitle>
                  <DialogDescription className="text-gray-600 dark:text-gray-400">
                    {editingProduct
                      ? "Atualize as informações do produto."
                      : "Adicione um novo produto ao seu catálogo."
                    }
                  </DialogDescription>
                </DialogHeader>

                <Form {...productForm}>
                  <form onSubmit={productForm.handleSubmit(onSubmitProduct)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={productForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel className="text-gray-900 dark:text-white">Nome do Produto</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Nome do produto"
                                {...field}
                                className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={productForm.control}
                        name="sku"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-900 dark:text-white">SKU</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="SKU-001"
                                {...field}
                                className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={productForm.control}
                        name="barcode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-900 dark:text-white">Código de Barras</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="7891234567890"
                                {...field}
                                className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={productForm.control}
                        name="price"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-900 dark:text-white">Preço de Venda</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="99.90"
                                {...field}
                                className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={productForm.control}
                        name="costPrice"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-900 dark:text-white">Preço de Custo</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="75.00"
                                {...field}
                                className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={productForm.control}
                        name="categoryId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-900 dark:text-white">Categoria</FormLabel>
                            <Select onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)} value={field.value?.toString()}>
                              <FormControl>
                                <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                                  <SelectValue placeholder="Selecione uma categoria" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                                {categories.map((category) => (
                                  <SelectItem key={category.id} value={category.id.toString()}>
                                    {category.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={productForm.control}
                        name="manufacturerId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-900 dark:text-white">Fabricante</FormLabel>
                            <Select onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)} value={field.value?.toString()}>
                              <FormControl>
                                <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                                  <SelectValue placeholder="Selecione um fabricante" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                                {manufacturers.map((manufacturer) => (
                                  <SelectItem key={manufacturer.id} value={manufacturer.id.toString()}>
                                    {manufacturer.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={productForm.control}
                        name="stock"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-900 dark:text-white">Estoque Atual</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={productForm.control}
                        name="minStock"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-900 dark:text-white">Estoque Mínimo</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={productForm.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-900 dark:text-white">Status</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                                  <SelectValue placeholder="Selecione o status" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                                <SelectItem value="active">Ativo</SelectItem>
                                <SelectItem value="inactive">Inativo</SelectItem>
                                <SelectItem value="discontinued">Descontinuado</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={productForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-900 dark:text-white">Descrição</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Descrição detalhada do produto..."
                              className="resize-none bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Product Images */}
                    <div className="space-y-4">
                      <Label className="text-gray-900 dark:text-white">Imagens do Produto</Label>
                      
                      <DragDropUpload 
                        onFileSelect={handleProductImageUpload}
                        multiple={true}
                      />

                      {productImages.length > 0 && (
                        <div className="grid grid-cols-3 gap-2">
                          {productImages.map((image, index) => (
                            <div key={index} className="relative group">
                              <img
                                src={image}
                                alt={`Produto ${index + 1}`}
                                className="w-full h-20 object-cover rounded border"
                              />
                              <Button
                                type="button"
                                onClick={() => removeProductImage(index)}
                                size="sm"
                                variant="destructive"
                                className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                              {index === 0 && (
                                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 rounded-b">
                                  Principal
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsProductDialogOpen(false)}
                        className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="submit"
                        disabled={createProductMutation.isPending || updateProductMutation.isPending}
                      >
                        {editingProduct ? "Atualizar" : "Criar"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Products Grid */}
          {isLoadingProducts ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(9)].map((_, i) => (
                <Card key={i} className="animate-pulse bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="w-full h-48 bg-gray-300 dark:bg-gray-600 rounded"></div>
                      <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : displayedProducts.length === 0 ? (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Nenhum produto encontrado</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {searchTerm || statusFilter !== "all" || categoryFilter !== "all"
                  ? "Tente ajustar os filtros de busca."
                  : "Comece criando seu primeiro produto."
                }
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayedProducts.map((product) => (
                  <Card key={product.id} className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        {/* Product Image */}
                        <div className="relative">
                          {product.images && product.images.length > 0 ? (
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              className="w-full h-48 object-cover rounded-lg"
                            />
                          ) : (
                            <div className="w-full h-48 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                              <Package className="w-12 h-12 text-gray-400" />
                            </div>
                          )}
                          {product.featured && (
                            <Badge className="absolute top-2 left-2 bg-yellow-500 text-white">
                              <Star className="w-3 h-3 mr-1" />
                              Destaque
                            </Badge>
                          )}
                          <div className="absolute top-2 right-2 flex items-center space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditProduct(product)}
                              className="h-8 w-8 p-0 bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="text-gray-900 dark:text-white">
                                    Excluir Produto
                                  </AlertDialogTitle>
                                  <AlertDialogDescription className="text-gray-600 dark:text-gray-400">
                                    Tem certeza que deseja excluir {product.name}? Esta ação não pode ser desfeita.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">
                                    Cancelar
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteProduct(product.id)}
                                    className="bg-red-600 hover:bg-red-700 text-white"
                                  >
                                    Excluir
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>

                        {/* Product Info */}
                        <div className="space-y-2">
                          <div className="flex items-start justify-between">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-2">
                              {product.name}
                            </h3>
                            <Badge
                              variant={product.status === "active" ? "default" : "secondary"}
                              className={
                                product.status === "active"
                                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                  : product.status === "discontinued"
                                    ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                                    : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                              }
                            >
                              {product.status === "active" ? "Ativo" : product.status === "discontinued" ? "Descontinuado" : "Inativo"}
                            </Badge>
                          </div>

                          <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                            <div className="flex items-center">
                              <Barcode className="w-4 h-4 mr-2" />
                              <span className="font-mono">{product.sku}</span>
                            </div>
                            <div className="flex items-center">
                              <Tag className="w-4 h-4 mr-2" />
                              <span>{getCategoryName(product.categoryId)}</span>
                            </div>
                            {product.manufacturerId && (
                              <div className="flex items-center">
                                <Building2 className="w-4 h-4 mr-2" />
                                <span>{getManufacturerName(product.manufacturerId)}</span>
                              </div>
                            )}
                          </div>

                          {product.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                              {product.description}
                            </p>
                          )}

                          <div className="flex items-center justify-between pt-2">
                            <div className="space-y-1">
                              <div className="text-lg font-bold text-gray-900 dark:text-white">
                                R$ {parseFloat(product.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </div>
                              {product.costPrice && (
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  Custo: R$ {parseFloat(product.costPrice).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </div>
                              )}
                            </div>
                            <div className="text-right">
                              <div className="flex items-center text-sm">
                                <ShoppingCart className="w-4 h-4 mr-1" />
                                <span className={product.stock <= (product.minStock || 0) ? "text-red-600 dark:text-red-400 font-semibold" : "text-gray-900 dark:text-white"}>
                                  {product.stock}
                                </span>
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                em estoque
                              </div>
                            </div>
                          </div>

                          {product.tags && product.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-2">
                              {product.tags.slice(0, 3).map((tag, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                              {product.tags.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{product.tags.length - 3}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Loading indicator for infinite scroll */}
              {isLoadingMore && (
                <div className="flex justify-center items-center py-8">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-gray-600 dark:text-gray-400">Carregando mais produtos...</span>
                  </div>
                </div>
              )}

              {/* End of results indicator */}
              {displayedProducts.length >= filteredProducts.length && displayedProducts.length > 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    Todos os produtos foram carregados ({filteredProducts.length} produtos)
                  </p>
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Categorias</h2>
            <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleNewCategory} className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Nova Categoria
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px] bg-white dark:bg-gray-800">
                <DialogHeader>
                  <DialogTitle className="text-gray-900 dark:text-white">
                    {editingCategory ? "Editar Categoria" : "Nova Categoria"}
                  </DialogTitle>
                  <DialogDescription className="text-gray-600 dark:text-gray-400">
                    {editingCategory
                      ? "Atualize as informações da categoria."
                      : "Adicione uma nova categoria ao sistema."
                    }
                  </DialogDescription>
                </DialogHeader>

                <Form {...categoryForm}>
                  <form onSubmit={categoryForm.handleSubmit(handleCategorySubmit)} className="space-y-4">
                    <FormField
                      control={categoryForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-900 dark:text-white">Nome</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Nome da categoria"
                              {...field}
                              className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={categoryForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-900 dark:text-white">Descrição</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Descrição da categoria..."
                              className="resize-none bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={categoryForm.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-900 dark:text-white">Status</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                                <SelectValue placeholder="Selecione o status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                              <SelectItem value="active">Ativo</SelectItem>
                              <SelectItem value="inactive">Inativo</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Category Image */}
                    <div className="space-y-2">
                      <Label className="text-gray-900 dark:text-white">Imagem da Categoria</Label>
                      
                      <DragDropUpload 
                        onFileSelect={handleCategoryImageUpload}
                        multiple={false}
                      />

                      {categoryImage && (
                        <div className="flex items-center space-x-2">
                          <img src={categoryImage} alt="Preview" className="w-16 h-16 object-cover rounded" />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setCategoryImage("")}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsCategoryDialogOpen(false)}
                        className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="submit"
                        disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}
                      >
                        {editingCategory ? "Atualizar" : "Criar"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Categories Grid */}
          {isLoadingCategories ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="w-full h-32 bg-gray-300 dark:bg-gray-600 rounded"></div>
                      <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-12">
              <FolderPlus className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Nenhuma categoria encontrada</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Comece criando sua primeira categoria.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((category) => (
                <Card key={category.id} className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {/* Category Image */}
                      <div className="relative">
                        {category.image ? (
                          <img
                            src={category.image}
                            alt={category.name}
                            className="w-full h-32 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-full h-32 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                            <FolderPlus className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                        <div className="absolute top-2 right-2 flex items-center space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditCategory(category)}
                            className="h-8 w-8 p-0 bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-gray-900 dark:text-white">
                                  Excluir Categoria
                                </AlertDialogTitle>
                                <AlertDialogDescription className="text-gray-600 dark:text-gray-400">
                                  Tem certeza que deseja excluir {category.name}? Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">
                                  Cancelar
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteCategory(category.id)}
                                  className="bg-red-600 hover:bg-red-700 text-white"
                                >
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>

                      {/* Category Info */}
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {category.name}
                          </h3>
                          <Badge
                            variant={category.status === "active" ? "default" : "secondary"}
                            className={
                              category.status === "active"
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                            }
                          >
                            {category.status === "active" ? "Ativo" : "Inativo"}
                          </Badge>
                        </div>

                        {category.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                            {category.description}
                          </p>
                        )}

                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Criado em {new Date(category.createdAt).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Manufacturers Tab */}
        <TabsContent value="manufacturers" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Fabricantes</h2>
            <Dialog open={isManufacturerDialogOpen} onOpenChange={setIsManufacturerDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleNewManufacturer} className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Novo Fabricante
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px] bg-white dark:bg-gray-800">
                <DialogHeader>
                  <DialogTitle className="text-gray-900 dark:text-white">
                    {editingManufacturer ? "Editar Fabricante" : "Novo Fabricante"}
                  </DialogTitle>
                  <DialogDescription className="text-gray-600 dark:text-gray-400">
                    {editingManufacturer
                      ? "Atualize as informações do fabricante."
                      : "Adicione um novo fabricante ao sistema."
                    }
                  </DialogDescription>
                </DialogHeader>

                <Form {...manufacturerForm}>
                  <form onSubmit={manufacturerForm.handleSubmit(handleManufacturerSubmit)} className="space-y-4">
                    <FormField
                      control={manufacturerForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-900 dark:text-white">Nome</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Nome do fabricante"
                              {...field}
                              className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={manufacturerForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-900 dark:text-white">Descrição</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Descrição do fabricante..."
                              className="resize-none bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={manufacturerForm.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-900 dark:text-white">Status</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                                <SelectValue placeholder="Selecione o status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                              <SelectItem value="active">Ativo</SelectItem>
                              <SelectItem value="inactive">Inativo</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Manufacturer Image */}
                    <div className="space-y-2">
                      <Label className="text-gray-900 dark:text-white">Imagem</Label>
                      
                      <DragDropUpload 
                        onFileSelect={handleManufacturerImageUpload}
                        multiple={false}
                      />

                      {manufacturerImage && (
                        <div className="flex items-center space-x-2">
                          <img src={manufacturerImage} alt="Preview" className="w-16 h-16 object-cover rounded" />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setManufacturerImage("")}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsManufacturerDialogOpen(false)}
                        className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="submit"
                        disabled={createManufacturerMutation.isPending || updateManufacturerMutation.isPending}
                      >
                        {editingManufacturer ? "Atualizar" : "Criar"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Manufacturers Grid */}
          {isLoadingManufacturers ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="w-full h-32 bg-gray-300 dark:bg-gray-600 rounded"></div>
                      <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : manufacturers.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Nenhum fabricante encontrado</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Comece criando seu primeiro fabricante.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {manufacturers.map((manufacturer) => (
                <Card key={manufacturer.id} className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {/* Manufacturer Image */}
                      <div className="relative">
                        {manufacturer.image ? (
                          <img
                            src={manufacturer.image}
                            alt={manufacturer.name}
                            className="w-full h-32 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-full h-32 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                            <Building2 className="w-12 h-12 text-gray-400" />
                          </div>
                        )}
                        <div className="absolute top-2 right-2 flex items-center space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditManufacturer(manufacturer)}
                            className="h-8 w-8 p-0 bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-gray-900 dark:text-white">
                                  Excluir Fabricante
                                </AlertDialogTitle>
                                <AlertDialogDescription className="text-gray-600 dark:text-gray-400">
                                  Tem certeza que deseja excluir {manufacturer.name}? Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">
                                  Cancelar
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteManufacturer(manufacturer.id)}
                                  className="bg-red-600 hover:bg-red-700 text-white"
                                >
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>

                      {/* Manufacturer Info */}
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {manufacturer.name}
                          </h3>
                          <Badge
                            variant={manufacturer.status === "active" ? "default" : "secondary"}
                            className={
                              manufacturer.status === "active"
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                            }
                          >
                            {manufacturer.status === "active" ? "Ativo" : "Inativo"}
                          </Badge>
                        </div>

                        {manufacturer.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                            {manufacturer.description}
                          </p>
                        )}

                        <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                          {manufacturer.email && (
                            <div className="flex items-center">
                              <span className="font-medium">Email:</span>
                              <span className="ml-2">{manufacturer.email}</span>
                            </div>
                          )}
                          {manufacturer.phone && (
                            <div className="flex items-center">
                              <span className="font-medium">Telefone:</span>
                              <span className="ml-2">{manufacturer.phone}</span>
                            </div>
                          )}
                          {manufacturer.website && (
                            <div className="flex items-center">
                              <Globe className="w-4 h-4 mr-1" />
                              <a
                                href={manufacturer.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 dark:text-blue-400 hover:underline"
                              >
                                Website
                              </a>
                            </div>
                          )}
                        </div>

                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Criado em {new Date(manufacturer.createdAt).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
