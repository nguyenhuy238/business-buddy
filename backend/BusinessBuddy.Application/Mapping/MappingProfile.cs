using AutoMapper;
using BusinessBuddy.Application.DTOs;
using BusinessBuddy.Domain.Entities;

namespace BusinessBuddy.Application.Mapping;

public class MappingProfile : Profile
{
    public MappingProfile()
    {
        // Product mappings
        CreateMap<CreateProductDto, Product>();
        CreateMap<UpdateProductDto, Product>().ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));
        CreateMap<Product, ProductDto>();

        // Customer mappings
        CreateMap<CreateCustomerDto, Customer>();
        CreateMap<UpdateCustomerDto, Customer>().ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));
        CreateMap<Customer, CustomerDto>()
            .ForMember(dest => dest.MembershipTier, opt => opt.MapFrom(src => src.MembershipTier.ToString()));

        // SaleOrder mappings
        CreateMap<SaleOrder, SaleOrderDto>()
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()))
            .ForMember(dest => dest.DiscountType, opt => opt.MapFrom(src => src.DiscountType.ToString()))
            .ForMember(dest => dest.PaymentMethod, opt => opt.MapFrom(src => src.PaymentMethod.ToString()))
            .ForMember(dest => dest.CustomerName, opt => opt.MapFrom(src => src.Customer != null ? src.Customer.Name : null))
            .ForMember(dest => dest.Items, opt => opt.MapFrom(src => src.Items != null ? src.Items : new List<SaleOrderItem>()));

        CreateMap<SaleOrderItem, SaleOrderItemDto>()
            .ForMember(dest => dest.DiscountType, opt => opt.MapFrom(src => src.DiscountType.ToString()))
            .ForMember(dest => dest.ProductName, opt => opt.MapFrom(src => src.Product != null ? src.Product.Name : string.Empty))
            .ForMember(dest => dest.UnitName, opt => opt.MapFrom(src => src.Unit != null ? src.Unit.Name : string.Empty));

        // CreateSaleOrderDto to SaleOrder mapping
        CreateMap<CreateSaleOrderDto, SaleOrder>()
            .ForMember(dest => dest.Id, opt => opt.MapFrom(src => Guid.NewGuid()))
            .ForMember(dest => dest.Code, opt => opt.Ignore()) // Will be set in controller
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => ParseEnum<SaleOrderStatus>(src.Status ?? "Completed", SaleOrderStatus.Completed)))
            .ForMember(dest => dest.DiscountType, opt => opt.MapFrom(src => ParseEnum<DiscountType>(src.DiscountType ?? "Percent", DiscountType.Percent)))
            .ForMember(dest => dest.PaymentMethod, opt => opt.MapFrom(src => ParseEnum<PaymentMethod>(src.PaymentMethod ?? "Cash", PaymentMethod.Cash)))
            .ForMember(dest => dest.Subtotal, opt => opt.Ignore()) // Will be calculated in controller
            .ForMember(dest => dest.Total, opt => opt.Ignore()) // Will be calculated in controller
            .ForMember(dest => dest.Items, opt => opt.MapFrom(src => src.Items))
            .ForMember(dest => dest.Customer, opt => opt.Ignore())
            .ForMember(dest => dest.CashbookEntries, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.CompletedAt, opt => opt.MapFrom(src => (DateTime?)null));

        // CreateSaleOrderItemDto to SaleOrderItem mapping
        CreateMap<CreateSaleOrderItemDto, SaleOrderItem>()
            .ForMember(dest => dest.Id, opt => opt.MapFrom(src => Guid.NewGuid()))
            .ForMember(dest => dest.SaleOrderId, opt => opt.Ignore()) // Will be set in controller
            .ForMember(dest => dest.DiscountType, opt => opt.MapFrom(src => ParseEnum<DiscountType>(src.DiscountType ?? "Percent", DiscountType.Percent)))
            .ForMember(dest => dest.Total, opt => opt.MapFrom(src => 
                src.Quantity * src.UnitPrice - (src.DiscountType == "Percent" ? (src.Quantity * src.UnitPrice * src.Discount / 100) : src.Discount)))
            .ForMember(dest => dest.SaleOrder, opt => opt.Ignore())
            .ForMember(dest => dest.Product, opt => opt.Ignore())
            .ForMember(dest => dest.Unit, opt => opt.Ignore())
            .ForMember(dest => dest.CostPrice, opt => opt.Ignore())
            .ForMember(dest => dest.SortOrder, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedAt, opt => opt.Ignore());

        // PaymentSettings mappings
        CreateMap<CreatePaymentSettingsDto, PaymentSettings>()
            .ForMember(dest => dest.Id, opt => opt.MapFrom(src => Guid.NewGuid()))
            .ForMember(dest => dest.PaymentMethod, opt => opt.MapFrom(src => ParseEnum<PaymentMethod>(src.PaymentMethod, PaymentMethod.Cash)))
            .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore());

        CreateMap<UpdatePaymentSettingsDto, PaymentSettings>()
            .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));

        CreateMap<PaymentSettings, PaymentSettingsDto>()
            .ForMember(dest => dest.PaymentMethod, opt => opt.MapFrom(src => src.PaymentMethod.ToString()));

        // Add more mappings as needed
    }

    /**
     * Helper method to parse enum from string with fallback
     */
    private static T ParseEnum<T>(string value, T defaultValue) where T : struct, Enum
    {
        if (Enum.TryParse<T>(value, true, out var result))
        {
            return result;
        }
        return defaultValue;
    }
}

